class RandomSelector {
    constructor() {
        this.elements = JSON.parse(localStorage.getItem('tirage.elements')) || [];
        this.picked = [];
        this.history = JSON.parse(localStorage.getItem('tirage.drawHistory')) || [];
    }

    addElement(value) {
        const trimmed = value.trim();
        if (trimmed === '') throw new Error('Veuillez entrer une valeur valide.');
        if (this.elements.includes(trimmed)) throw new Error('Cette valeur est déjà dans la liste.');
        this.elements.push(trimmed);
        this.saveList();
    }

    removeElement(index) {
        if (index < 0 || index >= this.elements.length) throw new Error('Index invalide.');
        this.elements.splice(index, 1);
        this.saveList();
    }

    updateElement(index, value) {
        if (index < 0 || index >= this.elements.length) throw new Error('Index invalide.');
        const trimmed = value.trim();
        if (trimmed === '') throw new Error('Veuillez entrer une valeur valide.');
        if (this.elements.includes(trimmed)) throw new Error('Cette valeur est déjà dans la liste.');
        this.elements[index] = trimmed;
        this.saveList();
    }

    resetList() {
        this.elements = [];
        this.saveList();
    }

    drawRandom(count, withoutReplacement = true) {
        if (this.elements.length === 0) throw new Error('La liste est vide.');
        if (count <= 0) throw new Error('Le nombre doit être supérieur à 0.');
        if (count > this.elements.length && withoutReplacement) throw new Error(`Vous ne pouvez pas tirer plus de ${this.elements.length} éléments sans remplacement.`);

        this.picked = [];
        const temp = [...this.elements];

        for (let i = 0; i < count; i++) {
            const index = Math.floor(Math.random() * temp.length);
            this.picked.push(temp[index]);
            if (withoutReplacement) temp.splice(index, 1);
        }

        this.recordHistory(count, withoutReplacement);
        return this.picked;
    }

    /**
     * Distributes all elements across a given number of teams as evenly as possible.
     * Ex: 21 elements / 4 teams -> 6, 5, 5, 5
     * @param {number} teamCount - Number of teams to create
     * @returns {string[][]} Array of teams
     */
    generateBalancedTeams(teamCount) {
        if (this.elements.length === 0) throw new Error('La liste est vide.');
        if (teamCount < 1) throw new Error('Le nombre d\'équipes doit être au moins 1.');
        if (teamCount > this.elements.length) throw new Error(`Vous ne pouvez pas créer ${teamCount} équipes avec seulement ${this.elements.length} éléments.`);

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

    recordHistory(count, withoutReplacement) {
        const type = withoutReplacement ? 'Sans remplacement' : 'Avec remplacement';
        this.history.push({
            date: new Date().toISOString(),
            items: [...this.picked],
            type: `Tirage de ${count} élément(s) ${type}`
        });
        if (this.history.length > 100) this.history.shift();
        this.saveHistory();
    }

    exportList() {
        return JSON.stringify(this.elements, null, 2);
    }

    importList(jsonData) {
        const data = JSON.parse(jsonData);
        if (!Array.isArray(data)) throw new Error('Format JSON invalide (tableau attendu).');
        const newItems = data.filter(n => typeof n === 'string' && n.trim() !== '');
        const before = this.elements.length;
        this.elements = [...new Set([...this.elements, ...newItems])];
        this.saveList();
        return this.elements.length - before;
    }

    generateShareLink() {
        const base = window.location.origin + window.location.pathname;
        return `${base}?items=${encodeURIComponent(this.elements.join(','))}`;
    }

    saveList() {
        localStorage.setItem('tirage.elements', JSON.stringify(this.elements));
    }

    saveHistory() {
        localStorage.setItem('tirage.drawHistory', JSON.stringify(this.history));
    }

    getElements() { return [...this.elements]; }
    getPicked() { return [...this.picked]; }
}
