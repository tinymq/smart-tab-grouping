let groupConfig = {};

// 获取域名的函数
function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

// 获取网站名称（用于自动命名）
function getSiteName(domain) {
  // 移除常见的顶级域名和子域名
  const parts = domain.split('.');
  if (parts.length >= 2) {
    // 优先使用主域名部分
    return parts[parts.length - 2].charAt(0).toUpperCase() + 
           parts[parts.length - 2].slice(1);
  }
  return domain;
}

// 自动分配颜色
const COLORS = ['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan'];
let colorIndex = 0;
const domainColors = new Map();

function getColorForDomain(domain) {
  if (!domainColors.has(domain)) {
    domainColors.set(domain, COLORS[colorIndex % COLORS.length]);
    colorIndex++;
  }
  return domainColors.get(domain);
}

// 改进配置加载
async function loadConfig() {
  const result = await chrome.storage.local.get('groupConfig');
  groupConfig = result.groupConfig || {};
}

// 改进配置保存
async function saveConfig() {
  await chrome.storage.local.set({ groupConfig });
}

// 优化 createGroupRule 函数
async function createGroupRule(domain) {
  if (!groupConfig[domain]) {
    groupConfig[domain] = {
      name: getSiteName(domain),
      color: getColorForDomain(domain)
    };
    await saveConfig();
  }
  return groupConfig[domain];
}

// 优化 scanAndGroupAllTabs 函数
async function scanAndGroupAllTabs() {
  const tabs = await chrome.tabs.query({});
  const tabsByDomain = new Map();
  
  // 按域名分类所有标签
  tabs.forEach(tab => {
    const domain = getDomain(tab.url);
    if (domain) {
      if (!tabsByDomain.has(domain)) {
        tabsByDomain.set(domain, []);
      }
      tabsByDomain.get(domain).push(tab);
    }
  });
  
  // 批量处理分组
  const groupPromises = [];
  for (const [domain, domainTabs] of tabsByDomain) {
    if (domainTabs.length >= 2) {
      groupPromises.push(groupTabsForDomain(domain, domainTabs));
    }
  }
  
  await Promise.all(groupPromises);
}

// 新增函数：为特定域名的标签创建分组
async function groupTabsForDomain(domain, tabs) {
  try {
    const rule = await createGroupRule(domain);
    const tabIds = tabs.map(tab => tab.id);
    const groupId = await chrome.tabs.group({ tabIds });
    await chrome.tabGroups.update(groupId, {
      title: rule.name,
      color: rule.color,
      collapsed: true // 设置为收起状态
    });
  } catch (error) {
    console.error(`分组域名 ${domain} 的标签时出错:`, error);
  }
}

// 优化 groupTab 函数
async function groupTab(tab) {
  const domain = getDomain(tab.url);
  if (!domain) return;

  try {
    const rule = await createGroupRule(domain);
    const existingGroup = await findExistingGroup(domain);

    let groupId;
    if (existingGroup) {
      // 如果已存在相同域名的组，将标签添加到该组
      groupId = existingGroup.id;
      await chrome.tabs.group({ tabIds: [tab.id], groupId });
    } else {
      // 否则创建新组
      groupId = await chrome.tabs.group({ tabIds: [tab.id] });
      await chrome.tabGroups.update(groupId, {
        title: rule.name,
        color: rule.color
      });
    }

    // 将分组设置为收起状态
    await chrome.tabGroups.update(groupId, { collapsed: true });

  } catch (error) {
    console.error(`分组标签 ${tab.id} 时出错:`, error);
  }
}

// 新增函数：查找现有的匹配域名的组
async function findExistingGroup(domain) {
  const groups = await chrome.tabGroups.query({});
  for (const group of groups) {
    const tabs = await chrome.tabs.query({ groupId: group.id });
    if (tabs.length > 0 && getDomain(tabs[0].url) === domain) {
      return group;
    }
  }
  return null;
}

// 监听标签页创建和更新事件
chrome.tabs.onCreated.addListener((tab) => {
  groupTab(tab);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    groupTab(tab);
  }
});

// 初始化时加载配置
chrome.runtime.onInstalled.addListener(() => {
  loadConfig().then(() => {
    scanAndGroupAllTabs();
  });
});

// 添加右键菜单选项来手动触发扫描
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'scanAndGroup',
    title: 'Scan and group all tabs',
    contexts: ['action']  // 扩展图标的右键菜单
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'scanAndGroup') {
    scanAndGroupAllTabs();
  }
});
