export const LanguagePack = {
    validLanguages: ["English", "Chinese"],
    defaultLanguage: "Chinese",

    English: {
        menuFile: "File",
        menuLanguage: "Language",
        actionEnglish: "English",
        actionChinese: "Chinese",
        actionNew: "New",
        actionOpen: "Open",
        actionSave: "Save",
        actionSaveAs: "Save As",
        actionAbout: "About",

        newFile: "Created an empty database.",
        openFile: "Open a database",
        saveFile: 'Database has been saved.',
        saveasFile: "Save the database",
        loadFile: 'Database has been loaded.',

        labelMagicNumber: "Magic Number:",
        labelService: "Service:",
        labelAccount: "Account:",
        labelPassword: "Password:",

        buttonAdd: "Add",
        addService: 'Successfully adding "{0}" into database.',
        buttonRemove: "Remove",
        removeService: 'Successfully removing "{0}" from database.',
        buttonFind: "Find",
        findService: 'Successfully finding account and password of "{0}" from database.',
        buttonClear: "Clear",
        clear: "All fields have been cleared.",

        dockWidgetServices: "List of Services",

        titleMainWindow: "Account Password Manager",
        titleEmptyFile: "Unnamed",
        titleAbout: "About Account Password Manager",

        messageTitle: "A voice from a piggy...",
        okToContinue: "Would you like to save unsaved changes?",
        addExistFile: 'I find an old "{0}". Can I eat it (｡◕∀◕｡)?',
        checkRemove: "Cruelly kill it (ﾟ∀。)?",
        findNoService: 'I can\'t find "{0}" (╥﹏╥)',
        saveNothing: 'Please add at least one service (*´∀`)~♥',

        ready: "Ready"
    },

    Chinese: {
        menuFile: "檔案",
        menuLanguage: "語言",
        actionEnglish: "英文",
        actionChinese: "中文",
        actionNew: "新檔案",
        actionOpen: "開啟",
        actionSave: "存檔",
        actionSaveAs: "另存新檔",
        actionAbout: "關於",

        newFile: "已建立一個空資料庫。",
        openFile: "選擇要開啟的資料庫",
        saveFile: '資料庫已儲存。',
        saveasFile: "儲存資料庫",
        loadFile: '已讀取資料庫。',

        labelMagicNumber: "魔法數字：",
        labelService: "服務：",
        labelAccount: "帳號：",
        labelPassword: "密碼：",

        buttonAdd: "加入",
        addService: '成功將"{0}"加入資料庫。',
        buttonRemove: "移除",
        removeService: '成功將"{0}"從資料庫移除。',
        buttonFind: "尋找",
        findService: '成功從資料庫中找到"{0}"的帳號密碼。',
        buttonClear: "清除",
        clear: "已清除所有欄位資料。",

        dockWidgetServices: "服務列表",

        titleMainWindow: "帳號密碼管理器",
        titleEmptyFile: "未命名",
        titleAbout: "關於帳號密碼管理器",

        messageTitle: "世外高人的聲音...",
        okToContinue: "小子，東西沒存就想跑，要不存一下？",
        addExistFile: '"{0}"這東西已經有啦，怎麼，喜新厭舊，舊的砍了嗎?',
        checkRemove: "我一刀下去可不留情，確定砍了？",
        findNoService: '你奶奶的，根本找不到"{0}"這個東西好嗎',
        saveNothing: "人都來了，難道不至少加一個東西再走？",

        ready: "準備完成"
    }
};

export class TranslationManager {
    constructor(lang = "Chinese") {
        this.currentLang = lang;
        this.pack = LanguagePack;
    }

    setLanguage(lang) {
        if (this.pack.validLanguages.includes(lang)) {
            this.currentLang = lang;
        }
    }

    get(key, ...args) {
        let str = this.pack[this.currentLang][key] || this.pack["English"][key] || key;
        args.forEach((arg, i) => {
            str = str.replace(`{${i}}`, arg);
        });
        return str;
    }
}
