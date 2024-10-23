let groupConfig = {};

// 颜色选项
const COLORS = [
  'grey', 'blue', 'red', 'yellow', 'green',
  'pink', 'purple', 'cyan'
];

// 加载配置
function loadConfig() {
  chrome.storage.local.get(['groupConfig'], function(result) {
    groupConfig = result.groupConfig || {};
    renderRules();
  });
}

// 保存配置
function saveConfig() {
  chrome.storage.local.set({ groupConfig }, function() {
    console.log('Configuration saved');
  });
}

// 渲染规则列表
function renderRules() {
  const rulesList = document.getElementById('rulesList');
  rulesList.innerHTML = '';
  
  Object.entries(groupConfig).forEach(([domain, rule]) => {
    const ruleDiv = document.createElement('div');
    ruleDiv.className = 'rule-item';
    ruleDiv.innerHTML = `
      <input type="text" value="${domain}" placeholder="Domain (e.g. example.com)" />
      <input type="text" value="${rule.name}" placeholder="Group name" />
      <select>
        ${COLORS.map(color => 
          `<option value="${color}" ${rule.color === color ? 'selected' : ''}>
            ${color}
          </option>`
        ).join('')}
      </select>
      <span class="color-preview" style="background-color: ${rule.color}"></span>
      <button class="delete-rule">Delete</button>
    `;
    
    // 添加事件监听器
    const inputs = ruleDiv.querySelectorAll('input');
    const select = ruleDiv.querySelector('select');
    const deleteBtn = ruleDiv.querySelector('.delete-rule');
    
    inputs[0].addEventListener('change', (e) => {
      const oldDomain = domain;
      const newDomain = e.target.value;
      groupConfig[newDomain] = groupConfig[oldDomain];
      delete groupConfig[oldDomain];
      saveConfig();
    });
    
    inputs[1].addEventListener('change', (e) => {
      groupConfig[domain].name = e.target.value;
      saveConfig();
    });
    
    select.addEventListener('change', (e) => {
      groupConfig[domain].color = e.target.value;
      ruleDiv.querySelector('.color-preview').style.backgroundColor = e.target.value;
      saveConfig();
    });
    
    deleteBtn.addEventListener('click', () => {
      delete groupConfig[domain];
      ruleDiv.remove();
      saveConfig();
    });
    
    rulesList.appendChild(ruleDiv);
  });
}

// 添加新规则
document.getElementById('addRule').addEventListener('click', () => {
  const domain = prompt('Enter domain (e.g. example.com):');
  if (domain) {
    groupConfig[domain] = {
      name: domain,
      color: 'grey'
    };
    saveConfig();
    renderRules();
  }
});

// 初始加载
document.addEventListener('DOMContentLoaded', loadConfig);