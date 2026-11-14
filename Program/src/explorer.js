/**
 * EXPLORER — local-first tree object, inspired by Cluster CEXP.
 * File handles stay in memory. Never scan directories until expanded.
 * Public Request: addDirectory, addFile, syncDocuments, setLocale, toggle.
 */
export function filterExplorerEntries(entries, query) {
  const term = String(query || '').trim().toLocaleLowerCase();
  if (!term) return entries;
  return entries.filter(entry => entry.name.toLocaleLowerCase().includes(term));
}

export class Explorer {
  #roots = [];
  #documents = [];
  #locale = 'zh-Hant';
  #active = null;
  #openFile;
  #openDocument;
  #log;
  #panel;
  #tree;
  #search;
  #sequence = 0;
  constructor({panel, openFile, openDocument, log = () => {}}) {
    this.#panel = panel;
    this.#tree = panel.querySelector('#explorerTree');
    this.#search = panel.querySelector('#explorerSearch');
    this.#openFile = openFile;
    this.#openDocument = openDocument;
    this.#log = log;
    this.#search.addEventListener('input', () => this.render());
    panel.querySelector('#explorerAddFolder').addEventListener('click',
      () => this.addDirectory());
    panel.querySelector('#explorerAddFile').addEventListener('click',
      () => this.addFile());
    panel.querySelector('#explorerClose').addEventListener('click',
      () => this.toggle(false));
    document.querySelector('#explorerToggle').addEventListener('click',
      () => this.toggle());
  }
  toggle(force) {
    const open = force === undefined ? this.#panel.hidden : Boolean(force);
    this.#panel.hidden = !open;
    document.querySelector('#explorerToggle').setAttribute(
      'aria-expanded', String(open));
  }
  setLocale(locale, translate) {
    this.#locale = locale;
    const labels = {
      explorerTitle: '#explorerTitle',
      explorerSearch: '#explorerSearch',
      explorerAddFolder: '#explorerAddFolder',
      explorerAddFile: '#explorerAddFile',
      explorerClose: '#explorerClose'
    };
    for (const [key, selector] of Object.entries(labels)) {
      const element = this.#panel.querySelector(selector);
      if (key === 'explorerSearch') {
        element.placeholder = translate(key);
        element.setAttribute('aria-label', translate(key));
      } else if (key === 'explorerTitle') element.textContent = translate(key);
      else {
        element.title = translate(key);
        element.setAttribute('aria-label', translate(key));
      }
    }
    document.querySelector('#explorerToggle').title = translate('explorerTitle');
    this.render();
  }
  syncDocuments(documents, activeId) {
    this.#documents = documents.map(item => ({...item}));
    this.#active = activeId;
    this.render();
  }
  async addDirectory() {
    if (!window.showDirectoryPicker) {
      this.#log('Directory picker unavailable');
      return;
    }
    try {
      const handle = await window.showDirectoryPicker({mode: 'read'});
      if (this.#roots.some(root => root.handle === handle)) return;
      this.#roots.push(this.#node(handle));
      this.render();
    } catch (error) {
      if (error.name !== 'AbortError') this.#log(String(error));
    }
  }
  async addFile() {
    if (!window.showOpenFilePicker) {
      document.querySelector('#fileInput').click();
      return;
    }
    try {
      const handles = await window.showOpenFilePicker({multiple: true});
      for (const handle of handles) {
        if (!this.#roots.some(root => root.handle === handle)) {
          this.#roots.push(this.#node(handle));
        }
        await this.#openFile(handle);
      }
      this.render();
    } catch (error) {
      if (error.name !== 'AbortError') this.#log(String(error));
    }
  }
  #node(handle) {
    return {id: ++this.#sequence, name: handle.name, kind: handle.kind,
      handle, expanded: false, children: null};
  }
  async #expand(node) {
    if (node.kind !== 'directory') {
      await this.#openFile(node.handle);
      return;
    }
    node.expanded = !node.expanded;
    if (node.expanded && node.children === null) {
      try {
        const children = [];
        for await (const handle of node.handle.values()) {
          children.push(this.#node(handle));
        }
        children.sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name) :
          a.kind === 'directory' ? -1 : 1));
        node.children = children;
      } catch (error) {
        node.expanded = false;
        this.#log(String(error));
      }
    }
    this.render();
  }
  render() {
    const query = this.#search.value.trim().toLocaleLowerCase();
    const fragment = document.createDocumentFragment();
    const section = (title, rows) => {
      const heading = document.createElement('div');
      heading.className = 'explorer-section';
      heading.textContent = title;
      fragment.append(heading);
      for (const row of rows) fragment.append(row);
    };
    const docs = this.#documents.filter(doc =>
      !query || doc.name.toLocaleLowerCase().includes(query));
    const docRows = docs.map(doc => {
      const button = this.#button(doc.name + (doc.dirty ? ' ●' : ''),
        doc.name, 'file', 0);
      if (doc.id === this.#active) button.classList.add('active');
      button.addEventListener('click', () => this.#openDocument(doc.id));
      return button;
    });
    section(this.#locale === 'en' ? 'OPEN EDITORS' : '已開啟文件', docRows);
    const nodes = [];
    const walk = (node, depth) => {
      const matches = !query || node.name.toLocaleLowerCase().includes(query);
      const descendants = [];
      if (node.children) {
        const prior = nodes.length;
        for (const child of node.children) walk(child, depth + 1);
        descendants.push(...nodes.splice(prior));
      }
      if (matches || descendants.length) {
        const button = this.#button(node.name, node.name, node.kind, depth);
        if (node.kind === 'directory') {
          button.querySelector('.explorer-arrow').textContent =
            node.expanded ? '⌄' : '›';
        }
        button.addEventListener('click', () => this.#expand(node));
        nodes.push(button);
        if (node.expanded || query) nodes.push(...descendants);
      }
    };
    for (const root of this.#roots) walk(root, 0);
    section(this.#locale === 'en' ? 'WORKSPACE' : '工作區', nodes);
    this.#tree.replaceChildren(fragment);
  }
  #button(label, name, kind, depth) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'explorer-entry';
    button.style.paddingInlineStart = (10 + depth * 15) + 'px';
    button.title = name;
    const arrow = document.createElement('span');
    arrow.className = 'explorer-arrow';
    arrow.textContent = kind === 'directory' ? '›' : '';
    const icon = document.createElement('span');
    icon.className = 'explorer-file-icon';
    icon.textContent = kind === 'directory' ? '▣' : '◇';
    const text = document.createElement('span');
    text.className = 'explorer-name';
    text.textContent = label;
    button.append(arrow, icon, text);
    return button;
  }
}
