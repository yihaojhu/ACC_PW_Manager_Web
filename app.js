import { TranslationManager } from './language.js';
import { encrypt, decrypt } from './crypto.js';

class RecentDB {
    constructor() {
        this.dbName = 'PasswordManagerDB';
        this.storeName = 'recentFiles';
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'name' });
                }
            };
        });
    }

    async saveHandle(handle) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.put({ name: handle.name, handle: handle, timestamp: Date.now() });
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    async getRecentFiles() {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const files = request.result.sort((a, b) => b.timestamp - a.timestamp);
                resolve(files.slice(0, 5)); // top 5
            };
        });
    }

    async removeHandle(name) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(name);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }
}

class App {
    constructor() {
        this.services = {};
        this.fileHandle = null;
        this.dirty = false;
        this.langManager = new TranslationManager();

        this.recentDB = new RecentDB();

        this.initDOM();
        this.bindEvents();
        this.updateLanguage();
        this.updateGUI(this.langManager.get('ready'));
        this.loadRecentFiles();
    }

    initDOM() {
        // Inputs
        this.magicNumber = document.getElementById('magicNumber');
        this.service = document.getElementById('service');
        this.account = document.getElementById('account');
        this.password = document.getElementById('password');

        // Buttons
        this.btnAdd = document.getElementById('buttonAdd');
        this.btnRemove = document.getElementById('buttonRemove');
        this.btnFind = document.getElementById('buttonFind');
        this.btnClear = document.getElementById('buttonClear');

        // UI Elements
        this.listServices = document.getElementById('listWidgetServices');
        this.statusMessage = document.getElementById('statusMessage');
        this.footerFileStatus = document.getElementById('footerFileStatus');
        this.appTitle = document.getElementById('titleMainWindow');

        // Modals
        this.modalOverlay = document.getElementById('modalOverlay');
        this.modalTitle = document.getElementById('modalTitle');
        this.modalMessage = document.getElementById('modalMessage');
        this.modalBtnYes = document.getElementById('modalBtnYes');
        this.modalBtnNo = document.getElementById('modalBtnNo');
        this.modalBtnCancel = document.getElementById('modalBtnCancel');
        this.modalBtnOk = document.getElementById('modalBtnOk');

        // Recent Files
        this.recentFilesContainer = document.getElementById('recentFilesContainer');
        this.recentFilesList = document.getElementById('recentFilesList');
    }

    bindEvents() {
        // Input tracking for button logic
        this.service.addEventListener('input', () => this.updateButtons());
        this.account.addEventListener('input', () => this.updateButtons());

        // Warn before closing if dirty
        window.addEventListener('beforeunload', (e) => {
            if (this.dirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        });

        // Actions
        this.btnAdd.addEventListener('click', () => this.addService());
        this.btnRemove.addEventListener('click', () => this.removeService());
        this.btnFind.addEventListener('click', () => this.findService());
        this.btnClear.addEventListener('click', () => this.clearFields());

        // Menus
        document.getElementById('actionNew').addEventListener('click', () => this.newFile());
        document.getElementById('actionOpen').addEventListener('click', () => this.openFile());
        document.getElementById('actionSave').addEventListener('click', () => this.saveFile());
        document.getElementById('actionSaveAs').addEventListener('click', () => this.saveasFile());
        document.getElementById('actionAbout').addEventListener('click', () => this.showAbout());

        // Toolbar
        document.getElementById('toolbarNew').addEventListener('click', () => this.newFile());
        document.getElementById('toolbarOpen').addEventListener('click', () => this.openFile());
        document.getElementById('toolbarSave').addEventListener('click', () => this.saveFile());
        document.getElementById('toolbarSaveAs').addEventListener('click', () => this.saveasFile());

        // Languages
        document.getElementById('actionEnglish').addEventListener('click', () => {
            this.langManager.setLanguage('English');
            this.updateLanguage();
        });
        document.getElementById('actionChinese').addEventListener('click', () => {
            this.langManager.setLanguage('Chinese');
            this.updateLanguage();
        });

        // Close dropdowns on click
        document.querySelectorAll('.dropdown button').forEach(btn => {
            btn.addEventListener('click', function () {
                const dropdown = this.closest('.dropdown');
                if (dropdown) {
                    dropdown.style.visibility = 'hidden';
                    dropdown.style.opacity = '0';

                    // Re-enable hover behavior once mouse leaves the menu item
                    const menuItem = dropdown.closest('.menu-item');
                    if (menuItem) {
                        menuItem.addEventListener('mouseleave', () => {
                            dropdown.style.visibility = '';
                            dropdown.style.opacity = '';
                        }, { once: true });
                    }
                }
            });
        });
    }

    updateLanguage() {
        const t = this.langManager;

        // Menus
        document.getElementById('menuFile').textContent = t.get('menuFile');
        document.getElementById('menuLanguage').textContent = t.get('menuLanguage');
        document.getElementById('actionNew').textContent = t.get('actionNew');
        document.getElementById('actionOpen').textContent = t.get('actionOpen');
        document.getElementById('actionSave').textContent = t.get('actionSave');
        document.getElementById('actionSaveAs').textContent = t.get('actionSaveAs');
        document.getElementById('actionEnglish').textContent = t.get('actionEnglish');
        document.getElementById('actionChinese').textContent = t.get('actionChinese');
        document.getElementById('actionAbout').textContent = t.get('actionAbout');

        // Labels
        document.getElementById('labelMagicNumber').textContent = t.get('labelMagicNumber');
        document.getElementById('labelService').textContent = t.get('labelService');
        document.getElementById('labelAccount').textContent = t.get('labelAccount');
        document.getElementById('labelPassword').textContent = t.get('labelPassword');

        // Buttons
        this.btnAdd.textContent = t.get('buttonAdd');
        this.btnRemove.textContent = t.get('buttonRemove');
        this.btnFind.textContent = t.get('buttonFind');
        this.btnClear.textContent = t.get('buttonClear');

        // Titles
        document.getElementById('dockWidgetServices').textContent = t.get('dockWidgetServices');
        this.appTitle.textContent = t.get('titleMainWindow');
        document.title = t.get('titleMainWindow');

        this.updateGUI();
    }

    updateButtons() {
        const s = this.service.value.trim();
        const a = this.account.value.trim();

        this.btnAdd.disabled = true;
        this.btnRemove.disabled = true;
        this.btnFind.disabled = true;

        if (s) {
            this.btnFind.disabled = false;
            this.btnRemove.disabled = false;
            if (a) {
                this.btnAdd.disabled = false;
            }
        }
    }

    updateGUI(msg = null) {
        if (msg) {
            this.statusMessage.textContent = msg;
            setTimeout(() => {
                if (this.statusMessage.textContent === msg) this.statusMessage.textContent = '';
            }, 5000);
        }

        // Render Services
        this.listServices.innerHTML = '';
        const sortedKeys = Object.keys(this.services).sort();
        for (const key of sortedKeys) {
            const li = document.createElement('li');
            li.className = 'service-item';
            li.textContent = key;
            li.addEventListener('click', () => {
                this.service.value = key;
                this.account.value = '';
                this.password.value = '';
                this.updateButtons();
                this.service.focus();
            });
            this.listServices.appendChild(li);
        }

        // Title update
        const title = this.langManager.get('titleMainWindow');
        let filename = this.fileHandle ? this.fileHandle.name : this.langManager.get('titleEmptyFile');
        const dirtyMarker = this.dirty ? '*' : '';
        this.footerFileStatus.textContent = `${filename}${dirtyMarker}`;
    }

    // Modal Helpers
    showModal(title, message, buttons) {
        return new Promise((resolve) => {
            this.modalTitle.textContent = title;
            this.modalMessage.textContent = message;

            // Hide all buttons
            [this.modalBtnYes, this.modalBtnNo, this.modalBtnCancel, this.modalBtnOk].forEach(b => b.classList.add('hidden'));

            const handleBtn = (res) => {
                this.modalOverlay.classList.add('hidden');
                // Cleanup event listeners
                [this.modalBtnYes, this.modalBtnNo, this.modalBtnCancel, this.modalBtnOk].forEach(b => {
                    const new_element = b.cloneNode(true);
                    b.parentNode.replaceChild(new_element, b);
                });
                // Re-fetch after clone
                this.initDOM();
                this.bindEvents(); // Minimal hack for quick clone, better to just remove event listener but this is cleaner
                resolve(res);
            };

            if (buttons.includes('yes')) {
                this.modalBtnYes.classList.remove('hidden');
                this.modalBtnYes.onclick = () => handleBtn('yes');
            }
            if (buttons.includes('no')) {
                this.modalBtnNo.classList.remove('hidden');
                this.modalBtnNo.onclick = () => handleBtn('no');
            }
            if (buttons.includes('cancel')) {
                this.modalBtnCancel.classList.remove('hidden');
                this.modalBtnCancel.onclick = () => handleBtn('cancel');
            }
            if (buttons.includes('ok')) {
                this.modalBtnOk.classList.remove('hidden');
                this.modalBtnOk.onclick = () => handleBtn('ok');
            }

            this.modalOverlay.classList.remove('hidden');
        });
    }

    async okToContinue() {
        if (this.dirty) {
            const res = await this.showModal(
                this.langManager.get('messageTitle'),
                this.langManager.get('okToContinue'),
                ['yes', 'no', 'cancel']
            );
            if (res === 'cancel') return false;
            if (res === 'yes') {
                await this.saveFile();
            }
        }
        return true;
    }

    // Button Actions
    async addService() {
        const s = this.service.value.trim();
        if (this.services[s]) {
            const res = await this.showModal(
                this.langManager.get('messageTitle'),
                this.langManager.get('addExistFile', s),
                ['yes', 'cancel']
            );
            if (res === 'cancel') return;
        }

        const mn = this.magicNumber.value.trim();
        const acc = this.account.value.trim();
        const pwd = this.password.value.trim();

        const encryptedAcc = await encrypt(acc, mn);
        const encryptedPwd = await encrypt(pwd, mn);

        this.services[s] = [encryptedAcc, encryptedPwd];
        this.dirty = true;
        this.updateGUI(this.langManager.get('addService', s));
        this.updateButtons();
    }

    async removeService() {
        const s = this.service.value.trim();
        if (this.services[s]) {
            const res = await this.showModal(
                this.langManager.get('messageTitle'),
                this.langManager.get('checkRemove'),
                ['yes', 'cancel']
            );
            if (res === 'cancel') return;

            delete this.services[s];
            this.dirty = true;
            this.updateGUI(this.langManager.get('removeService', s));
            this.updateButtons();
        } else {
            await this.showModal(
                this.langManager.get('messageTitle'),
                this.langManager.get('findNoService', s),
                ['ok']
            );
        }
    }

    async findService() {
        const s = this.service.value.trim();
        const mn = this.magicNumber.value.trim();

        if (this.services[s]) {
            const encryptedAcc = this.services[s][0];
            const encryptedPwd = this.services[s][1];

            const acc = await decrypt(encryptedAcc, mn);
            const pwd = await decrypt(encryptedPwd, mn);

            this.account.value = acc;
            this.password.value = pwd;

            this.updateGUI(this.langManager.get('findService', s));
        } else {
            await this.showModal(
                this.langManager.get('messageTitle'),
                this.langManager.get('findNoService', s),
                ['ok']
            );
        }
    }

    clearFields() {
        this.magicNumber.value = '';
        this.service.value = '';
        this.account.value = '';
        this.password.value = '';
        this.updateButtons();
        this.magicNumber.focus();
        this.updateGUI(this.langManager.get('clear'));
    }

    // File Actions
    async newFile() {
        if (!(await this.okToContinue())) return;
        this.services = {};
        this.fileHandle = null;
        this.dirty = false;
        this.updateGUI(this.langManager.get('newFile'));
        this.updateButtons();
    }

    async openFile() {
        if (!(await this.okToContinue())) return;

        if (window.showOpenFilePicker) {
            try {
                const [fileHandle] = await window.showOpenFilePicker({
                    types: [{
                        description: 'Password Database',
                        accept: { 'application/json': ['.json'] }
                    }]
                });
                const file = await fileHandle.getFile();
                const contents = await file.text();

                this.services = JSON.parse(contents);
                this.fileHandle = fileHandle;
                this.dirty = false;

                await this.recentDB.saveHandle(fileHandle);
                await this.loadRecentFiles();

                this.updateGUI(this.langManager.get('loadFile'));
                this.updateButtons();
            } catch (e) {
                console.error(e);
                // User cancelled or error
            }
        } else {
            // Fallback for mobile/Safari
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.style.display = 'none';
            document.body.appendChild(input);
            input.onchange = e => {
                const file = e.target.files[0];
                document.body.removeChild(input);

                if (!file) return;
                const reader = new FileReader();
                reader.onload = async (event) => {
                    try {
                        this.services = JSON.parse(event.target.result);
                        this.fileHandle = { name: file.name, isFallback: true };
                        this.dirty = false;
                        this.updateGUI(this.langManager.get('loadFile'));
                        this.updateButtons();
                    } catch (err) {
                        console.error('Failed to parse database file', err);
                        await this.showModal('Error', 'Failed to load file. It may be corrupted or not a valid database.', ['ok']);
                    }
                };
                reader.readAsText(file);
            };

            // Cleanup if user cancels file dialog (some browsers)
            window.addEventListener('focus', () => {
                setTimeout(() => {
                    if (input.parentNode) document.body.removeChild(input);
                }, 1000);
            }, { once: true });

            input.click();
        }
    }

    async saveFile() {
        if (Object.keys(this.services).length === 0) {
            await this.showModal(
                this.langManager.get('messageTitle'),
                this.langManager.get('saveNothing'),
                ['ok']
            );
            return;
        }

        if (!this.fileHandle || this.fileHandle.isFallback) {
            await this.saveasFile();
        } else {
            try {
                const writable = await this.fileHandle.createWritable();
                await writable.write(JSON.stringify(this.services, null, 2));
                await writable.close();

                this.dirty = false;
                this.updateGUI(this.langManager.get('saveFile'));
            } catch (e) {
                console.error(e);
            }
        }
    }

    async saveasFile() {
        if (Object.keys(this.services).length === 0) {
            await this.showModal(
                this.langManager.get('messageTitle'),
                this.langManager.get('saveNothing'),
                ['ok']
            );
            return;
        }

        if (window.showSaveFilePicker) {
            try {
                const fileHandle = await window.showSaveFilePicker({
                    types: [{
                        description: 'Password Database',
                        accept: { 'application/json': ['.json'] }
                    }],
                    suggestedName: 'passwords.json'
                });

                this.fileHandle = fileHandle;
                await this.saveFile();

                await this.recentDB.saveHandle(fileHandle);
                await this.loadRecentFiles();
            } catch (e) {
                console.error(e);
            }
        } else {
            // Fallback for mobile/Safari
            const jsonStr = JSON.stringify(this.services, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = (this.fileHandle && this.fileHandle.name) ? this.fileHandle.name : 'passwords.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            if (!this.fileHandle) {
                this.fileHandle = { name: 'passwords.json', isFallback: true };
            }
            this.dirty = false;
            this.updateGUI(this.langManager.get('saveFile'));
        }
    }

    async showAbout() {
        await this.showModal(
            this.langManager.get('titleAbout'),
            "Version: 2.0 \nAuthor: 朱奕豪(Yi-Hao, Jhu) \nContact: g9722525@gmail.com",
            ['ok']
        );
    }

    async loadRecentFiles() {
        const recentFiles = await this.recentDB.getRecentFiles();
        this.recentFilesList.innerHTML = '';

        if (recentFiles.length === 0) {
            this.recentFilesContainer.classList.add('hidden');
            return;
        }

        this.recentFilesContainer.classList.remove('hidden');
        recentFiles.forEach(rf => {
            const btn = document.createElement('button');
            btn.textContent = rf.name;
            btn.title = rf.name;
            btn.addEventListener('click', () => this.openFileFromHandle(rf.handle));
            this.recentFilesList.appendChild(btn);
        });
    }

    async openFileFromHandle(handle) {
        if (!(await this.okToContinue())) return;

        try {
            // Verify permission
            const opts = { mode: 'read' };
            if ((await handle.queryPermission(opts)) !== 'granted') {
                const req = await handle.requestPermission(opts);
                if (req !== 'granted') {
                    throw new Error('Permission denied');
                }
            }

            const file = await handle.getFile();
            const contents = await file.text();

            this.services = JSON.parse(contents);
            this.fileHandle = handle;
            this.dirty = false;

            await this.recentDB.saveHandle(handle);
            await this.loadRecentFiles();

            this.updateGUI(this.langManager.get('loadFile'));
            this.updateButtons();
        } catch (e) {
            console.error(e);
            if (e.name === 'NotFoundError' || e.message.includes('could not be found')) {
                await this.recentDB.removeHandle(handle.name);
                await this.loadRecentFiles();
                await this.showModal('Error', 'The file could not be found (it may have been moved or deleted). It has been removed from the recent files list.', ['ok']);
            } else if (e.message !== 'Permission denied') {
                await this.showModal('Error', 'Could not open the recent file.', ['ok']);
            }
        }
    }
}

// Start app
window.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
