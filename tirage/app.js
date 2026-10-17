/* Tirage & Équipes : logique (liste, tirages, équipes), sans dépendance au DOM.
   Les messages passent par RandomSelector.t (traducteur fourni par ui.js) ; repli : la clé. */
class RandomSelector {
    constructor() {
        // Données stockées : on ne garde que des chaînes valides (stockage corrompu ou ancien format)
        this.elements = RandomSelector.loadJSON('tirage.elements', [])
            .filter(v => typeof v === 'string' && v.trim() !== '' && v.length <= RandomSelector.MAX_LENGTH)
            .slice(0, RandomSelector.MAX_ITEMS);
        this.picked = [];
        this.history = RandomSelector.loadJSON('tirage.drawHistory', []);
    }

    static loadJSON(key, fallback) {
        try {
            const value = JSON.parse(localStorage.getItem(key));
            return Array.isArray(fallback) ? (Array.isArray(value) ? value : fallback) : (value ?? fallback);
        } catch (e) {
            return fallback;
        }
    }

    static msg(key, vars) {
        return (RandomSelector.t || (k => k))(key, vars);
    }

    addElement(value) {
        const trimmed = value.trim();
        if (trimmed === '') throw new Error(RandomSelector.msg('err.empty'));
        if (trimmed.length > RandomSelector.MAX_LENGTH) throw new Error(RandomSelector.msg('err.maxLength', { n: RandomSelector.MAX_LENGTH }));
        if (this.elements.length >= RandomSelector.MAX_ITEMS) throw new Error(RandomSelector.msg('err.maxItems', { n: RandomSelector.MAX_ITEMS }));
        if (this.elements.includes(trimmed)) throw new Error(RandomSelector.msg('err.duplicate'));
        this.elements.push(trimmed);
        this.saveList();
    }

    removeElement(index) {
        if (index < 0 || index >= this.elements.length) throw new Error(RandomSelector.msg('err.index'));
        this.elements.splice(index, 1);
        this.saveList();
    }

    updateElement(index, value) {
        if (index < 0 || index >= this.elements.length) throw new Error(RandomSelector.msg('err.index'));
        const trimmed = value.trim();
        if (trimmed === '') throw new Error(RandomSelector.msg('err.empty'));
        if (trimmed.length > RandomSelector.MAX_LENGTH) throw new Error(RandomSelector.msg('err.maxLength', { n: RandomSelector.MAX_LENGTH }));
        if (this.elements.includes(trimmed)) throw new Error(RandomSelector.msg('err.duplicate'));
        this.elements[index] = trimmed;
        this.saveList();
    }

    resetList() {
        this.elements = [];
        this.saveList();
    }

    drawRandom(count, withoutReplacement = true) {
        if (this.elements.length === 0) throw new Error(RandomSelector.msg('err.listEmpty'));
        if (!(count > 0)) throw new Error(RandomSelector.msg('err.countPositive'));
        if (count > this.elements.length && withoutReplacement) throw new Error(RandomSelector.msg('err.tooMany', { n: this.elements.length }));

        this.picked = [];
        const temp = [...this.elements];

        for (let i = 0; i < count; i++) {
            const index = Math.floor(Math.random() * temp.length);
            this.picked.push(temp[index]);
            if (withoutReplacement) temp.splice(index, 1);
        }

        this.recordHistory();
        return this.picked;
    }

    /**
     * Distributes all elements across a given number of teams as evenly as possible.
     * Ex: 21 elements / 4 teams -> 6, 5, 5, 5
     * @param {number} teamCount - Number of teams to create
     * @returns {string[][]} Array of teams
     */
    generateBalancedTeams(teamCount) {
        if (this.elements.length === 0) throw new Error(RandomSelector.msg('err.listEmpty'));
        if (!(teamCount >= 1)) throw new Error(RandomSelector.msg('err.teamsMin'));
        if (teamCount > this.elements.length) throw new Error(RandomSelector.msg('err.teamsTooMany', { teams: teamCount, n: this.elements.length }));

        // Fisher-Yates shuffle for a fair random distribution
        const items = [...this.elements];
        for (let i = items.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [items[i], items[j]] = [items[j], items[i]];
        }

        // Even split: base = floor(total/count), remainder = total % count
        // The first `remainder` teams get base+1, the rest get base
        const total = items.length;
        const base = Math.floor(total / teamCount);
        const remainder = total % teamCount;

        const teams = [];
        let index = 0;
        for (let i = 0; i < teamCount; i++) {
            const size = base + (i < remainder ? 1 : 0);
            teams.push(items.slice(index, index + size));
            index += size;
        }

        return teams;
    }

    recordHistory() {
        this.history.push({ date: new Date().toISOString(), items: [...this.picked] });
        if (this.history.length > 100) this.history.shift();
        this.saveHistory();
    }

    exportList() {
        return JSON.stringify(this.elements, null, 2);
    }

    importList(jsonData) {
        let data;
        try { data = JSON.parse(jsonData); } catch (e) { throw new Error(RandomSelector.msg('err.json')); }
        if (!Array.isArray(data)) throw new Error(RandomSelector.msg('err.json'));
        const newItems = data
            .filter(n => typeof n === 'string')
            .map(n => n.trim())
            .filter(n => n !== '' && n.length <= RandomSelector.MAX_LENGTH);
        const before = this.elements.length;
        this.elements = [...new Set([...this.elements, ...newItems])].slice(0, RandomSelector.MAX_ITEMS);
        this.saveList();
        return this.elements.length - before;
    }

    generateShareLink() {
        const base = window.location.origin + window.location.pathname;
        return `${base}?items=${encodeURIComponent(this.elements.join(','))}`;
    }

    saveList() {
        try { localStorage.setItem('tirage.elements', JSON.stringify(this.elements)); } catch (e) { /* stockage plein ou bloqué */ }
    }

    saveHistory() {
        try { localStorage.setItem('tirage.drawHistory', JSON.stringify(this.history)); } catch (e) { /* stockage plein ou bloqué */ }
    }

    getElements() { return [...this.elements]; }
    getPicked() { return [...this.picked]; }
}
RandomSelector.MAX_LENGTH = 60;
RandomSelector.MAX_ITEMS = 200;
