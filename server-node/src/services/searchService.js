/* global require, module */
const unidecode = require('unidecode');

function normalize_for_search(text) {
    text = unidecode(text.toLowerCase().trim());
    text = text.replace(/[^a-z\s]/g, '');
    text = text.replace(/\s+/g, ' ');
    return text;
}

function fuzzy_match(search_term, target, threshold = 0.6) {
    const search_normalized = normalize_for_search(search_term);
    const target_normalized = normalize_for_search(target);

    if (target_normalized.includes(search_normalized)) {
        return true;
    }

    if (target_normalized.startsWith(search_normalized)) {
        return true;
    }

    const words_search = search_normalized.split(' ');
    const words_target = target_normalized.split(' ');

    for (const search_word of words_search) {
        for (const target_word of words_target) {
            const ratio = similarity(search_word, target_word);
            if (ratio >= threshold) {
                return true;
            }
            if (target_word.includes(search_word) || target_word.startsWith(search_word)) {
                return true;
            }
        }
    }

    return false;
}

function similarity(s1, s2) {
    let longer = s1;
    let shorter = s2;
    if (s1.length < s2.length) {
        longer = s2;
        shorter = s1;
    }
    const longerLength = longer.length;
    if (longerLength === 0) {
        return 1.0;
    }
    return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
}

function editDistance(s1, s2) {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();

    const costs = [];
    for (let i = 0; i <= s1.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= s2.length; j++) {
            if (i === 0) {
                costs[j] = j;
            } else if (j > 0) {
                let newValue = costs[j - 1];
                if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
                    newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                }
                costs[j - 1] = lastValue;
                lastValue = newValue;
            }
        }
        if (i > 0) {
            costs[s2.length] = lastValue;
        }
    }
    return costs[s2.length];
}

function searchMembers(members, searchTerm) {
    if (!searchTerm) return members;

    const filtered = [];

    for (const member of members) {
        const full_name = `${member.first_name} ${member.last_name}`;
        const search_normalized = normalize_for_search(searchTerm);
        const full_name_normalized = normalize_for_search(full_name);
        const first_name_normalized = normalize_for_search(member.first_name);
        const last_name_normalized = normalize_for_search(member.last_name);

        let score = 0;

        if (search_normalized === full_name_normalized) {
            score = Math.max(score, 1000);
        }

        if (search_normalized === first_name_normalized || search_normalized === last_name_normalized) {
            score = Math.max(score, 900);
        }

        if (full_name_normalized.startsWith(search_normalized)) {
            score = Math.max(score, 800);
        }

        if (first_name_normalized.startsWith(search_normalized) || last_name_normalized.startsWith(search_normalized)) {
            score = Math.max(score, 700);
        }

        if (full_name_normalized.includes(search_normalized)) {
            score = Math.max(score, 600);
        }

        if (first_name_normalized.includes(search_normalized) || last_name_normalized.includes(search_normalized)) {
            score = Math.max(score, 500);
        }

        if (fuzzy_match(searchTerm, full_name)) {
            score = Math.max(score, 300);
        }

        if (fuzzy_match(searchTerm, member.first_name) || fuzzy_match(searchTerm, member.last_name)) {
            score = Math.max(score, 200);
        }

        if (member.email.toLowerCase().includes(searchTerm.toLowerCase())) {
            score = Math.max(score, 150);
        }

        if (member.phone && member.phone.includes(searchTerm)) {
            score = Math.max(score, 150);
        }

        if (searchTerm.includes(member.id.toString())) {
            score = Math.max(score, 150);
        }

        if (score > 0) {
            filtered.push({ score, member });
        }
    }

    filtered.sort((a, b) => b.score - a.score);
    return filtered.map(item => item.member);
}

module.exports = { searchMembers, normalize_for_search, fuzzy_match };
