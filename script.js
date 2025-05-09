    createNewTab() {
        const tabName = prompt('Enter tab name:', `New Tab ${this.tabCounter}`);
        if (tabName === null) return; // User cancelled the prompt
        
        this.tabCounter++;
        const tabId = `tab${this.tabCounter}`;
        const tab = document.createElement('div');
        tab.className = 'tab';
        tab.dataset.tab = tabId;
        tab.innerHTML = `
            <span class="tab-title">${tabName}</span>
            <button class="close-tab">×</button>
        `;
        
        document.getElementById('tabsList').appendChild(tab);
        this.tabContents.set(tabId, []); // Initialize empty list for new tab
        this.switchTab(tab);
        this.saveTabs();
    }
