
const API_URL = 'https://pokeapi.co/api/v2';
let typeData = {}; // Cache for type data
let allTypes = []; // List of all types

// Initialize the page when DOM content is loaded
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Fetch all types
        const response = await fetch(`${API_URL}/type`);
        const data = await response.json();
        allTypes = data.results.filter(type => type.name !== 'unknown' && type.name !== 'shadow');
        
        // Populate type selectors
        populateTypeSelectors();
        
        // Add event listeners
        document.getElementById('analyzeTypes').addEventListener('click', analyzeSelectedTypes);
        
        // Set up type button grid
        setupTypeButtonGrid();
        
        // Setup combo buttons
        setupComboButtons();
        
    } catch (error) {
        console.error('Error initializing type analysis page:', error);
        alert('Error loading Pokémon type data. Please try again later.');
    }
});

// Populate the type selectors with all available types
function populateTypeSelectors() {
    const primarySelect = document.getElementById('primaryType');
    const secondarySelect = document.getElementById('secondaryType');
    
    allTypes.forEach(type => {
        // Add to primary type selector
        const primaryOption = document.createElement('option');
        primaryOption.value = type.name;
        primaryOption.textContent = capitalizeFirstLetter(type.name);
        primarySelect.appendChild(primaryOption);
        
        // Add to secondary type selector
        const secondaryOption = document.createElement('option');
        secondaryOption.value = type.name;
        secondaryOption.textContent = capitalizeFirstLetter(type.name);
        secondarySelect.appendChild(secondaryOption);
    });
}

// Set up the grid of type buttons for quick analysis
function setupTypeButtonGrid() {
    const typeButtonGrid = document.getElementById('typeButtonGrid');
    
    allTypes.forEach(type => {
        const button = document.createElement('button');
        button.className = `type-button type-${type.name}`;
        button.textContent = capitalizeFirstLetter(type.name);
        button.dataset.type = type.name;
        
        button.addEventListener('click', function() {
            // Set the primary type select to this type
            document.getElementById('primaryType').value = type.name;
            // Clear the secondary type
            document.getElementById('secondaryType').value = '';
            // Trigger analysis
            analyzeSelectedTypes();
        });
        
        typeButtonGrid.appendChild(button);
    });
}

// Setup combo buttons
function setupComboButtons() {
    const comboButtons = document.querySelectorAll('.load-combo');
    comboButtons.forEach(button => {
        button.addEventListener('click', function() {
            const primaryType = this.dataset.primary;
            const secondaryType = this.dataset.secondary;
            
            document.getElementById('primaryType').value = primaryType;
            document.getElementById('secondaryType').value = secondaryType;
            
            analyzeSelectedTypes();
        });
    });
}

// Analyze the selected types
async function analyzeSelectedTypes() {
    const primaryTypeValue = document.getElementById('primaryType').value;
    const secondaryTypeValue = document.getElementById('secondaryType').value;
    
    if (!primaryTypeValue) {
        alert('Please select at least a primary type.');
        return;
    }
    
    try {
        // Show loading state
        document.getElementById('typeAnalysisResults').classList.remove('hidden');
        document.getElementById('analysisTypeDisplay').textContent = 'Loading...';
        clearAnalysisContainers();
        
        // Get type data
        const primaryTypeData = await getTypeData(primaryTypeValue);
        const secondaryTypeData = secondaryTypeValue ? await getTypeData(secondaryTypeValue) : null;
        
        // Display the selected types
        const typeDisplay = secondaryTypeValue ? 
            `${capitalizeFirstLetter(primaryTypeValue)} / ${capitalizeFirstLetter(secondaryTypeValue)}` : 
            capitalizeFirstLetter(primaryTypeValue);
        document.getElementById('analysisTypeDisplay').textContent = typeDisplay;
        
        // Calculate and display type matchups
        calculateTypeMatchups(primaryTypeData, secondaryTypeData);
        
    } catch (error) {
        console.error('Error analyzing types:', error);
        alert('Error analyzing Pokémon types. Please try again.');
    }
}

// Get type data (with caching)
async function getTypeData(typeName) {
    if (typeData[typeName]) {
        return typeData[typeName];
    }
    
    const response = await fetch(`${API_URL}/type/${typeName}`);
    const data = await response.json();
    typeData[typeName] = data;
    return data;
}

// Clear all analysis containers
function clearAnalysisContainers() {
    document.getElementById('superEffective').innerHTML = '';
    document.getElementById('weakTo').innerHTML = '';
    document.getElementById('resistantTo').innerHTML = '';
    document.getElementById('notEffective').innerHTML = '';
    document.getElementById('immuneTo').innerHTML = '';
    document.getElementById('noEffect').innerHTML = '';
    document.getElementById('offensiveScore').textContent = '0';
    document.getElementById('defensiveScore').textContent = '0';
    document.getElementById('scoreExplanation').textContent = 'Calculating...';
}

// Calculate and display type matchups
function calculateTypeMatchups(primaryType, secondaryType) {
    // Initialize sets to track unique types
    const superEffectiveTypes = new Set();
    const weakToTypes = new Set();
    const resistantToTypes = new Set();
    const notEffectiveTypes = new Set();
    const immuneToTypes = new Set();
    const noEffectTypes = new Set();
    
    // Process primary type offensive relations
    primaryType.damage_relations.double_damage_to.forEach(type => {
        superEffectiveTypes.add(type.name);
    });
    
    primaryType.damage_relations.half_damage_to.forEach(type => {
        notEffectiveTypes.add(type.name);
    });
    
    primaryType.damage_relations.no_damage_to.forEach(type => {
        noEffectTypes.add(type.name);
    });
    
    // Process primary type defensive relations
    primaryType.damage_relations.double_damage_from.forEach(type => {
        weakToTypes.add(type.name);
    });
    
    primaryType.damage_relations.half_damage_from.forEach(type => {
        resistantToTypes.add(type.name);
    });
    
    primaryType.damage_relations.no_damage_from.forEach(type => {
        immuneToTypes.add(type.name);
    });
    
    // If there's a secondary type, adjust relationships
    if (secondaryType) {
        // Process secondary type offensive relations (these are additive)
        secondaryType.damage_relations.double_damage_to.forEach(type => {
            if (!noEffectTypes.has(type.name) && !notEffectiveTypes.has(type.name)) {
                superEffectiveTypes.add(type.name);
            }
        });
        
        secondaryType.damage_relations.half_damage_to.forEach(type => {
            if (superEffectiveTypes.has(type.name)) {
                // If it was super effective from primary, but not effective from secondary,
                // they cancel out and it becomes normal effectiveness
                superEffectiveTypes.delete(type.name);
            } else {
                notEffectiveTypes.add(type.name);
            }
        });
        
        secondaryType.damage_relations.no_damage_to.forEach(type => {
            // No effect trumps everything
            superEffectiveTypes.delete(type.name);
            notEffectiveTypes.delete(type.name);
            noEffectTypes.add(type.name);
        });
        
        // Process secondary type defensive relations
        // For defensive relations, we need to be more careful with dual types
        
        // First, collect new weaknesses from secondary type
        const newWeakToTypes = new Set();
        secondaryType.damage_relations.double_damage_from.forEach(type => {
            if (!resistantToTypes.has(type.name) && !immuneToTypes.has(type.name)) {
                newWeakToTypes.add(type.name);
            } else if (resistantToTypes.has(type.name)) {
                // If primary resists but secondary is weak, they cancel out
                resistantToTypes.delete(type.name);
            }
        });
        
        // Add new weaknesses, but remove any that are now immune
        newWeakToTypes.forEach(type => {
            if (!immuneToTypes.has(type)) {
                weakToTypes.add(type);
            }
        });
        
        // Add new resistances
        secondaryType.damage_relations.half_damage_from.forEach(type => {
            if (weakToTypes.has(type.name)) {
                // If primary is weak but secondary resists, they cancel out
                weakToTypes.delete(type.name);
            } else if (!immuneToTypes.has(type.name)) {
                resistantToTypes.add(type.name);
            }
        });
        
        // Add new immunities
        secondaryType.damage_relations.no_damage_from.forEach(type => {
            // Immunity trumps everything
            weakToTypes.delete(type.name);
            resistantToTypes.delete(type.name);
            immuneToTypes.add(type.name);
        });
    }
    
    // Display results
    displayTypeCollection(superEffectiveTypes, 'superEffective');
    displayTypeCollection(weakToTypes, 'weakTo');
    displayTypeCollection(resistantToTypes, 'resistantTo');
    displayTypeCollection(notEffectiveTypes, 'notEffective');
    displayTypeCollection(immuneToTypes, 'immuneTo');
    displayTypeCollection(noEffectTypes, 'noEffect');
    
    // Calculate and display scores
    calculateScores(superEffectiveTypes, weakToTypes, resistantToTypes, immuneToTypes);
}

// Display a collection of types as badges
function displayTypeCollection(typeSet, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    if (typeSet.size === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'empty-message';
        emptyMessage.textContent = 'None';
        container.appendChild(emptyMessage);
        return;
    }
    
    Array.from(typeSet).sort().forEach(type => {
        const badge = document.createElement('span');
        badge.className = `type-badge type-${type}`;
        badge.textContent = capitalizeFirstLetter(type);
        container.appendChild(badge);
    });
}

// Calculate offensive and defensive scores
function calculateScores(superEffectiveTypes, weakToTypes, resistantToTypes, immuneToTypes) {
    // Offensive score is based on coverage (how many types you're super effective against)
    const offensiveScore = superEffectiveTypes.size;
    
    // Defensive score is calculated based on resistances - weaknesses + (immunities * 2)
    const defensiveScore = resistantToTypes.size - weakToTypes.size + (immuneToTypes.size * 2);
    
    // Display scores
    document.getElementById('offensiveScore').textContent = offensiveScore;
    document.getElementById('defensiveScore').textContent = defensiveScore;
    
    // Set appropriate classes for the score display
    setScoreClass('offensiveScore', offensiveScore);
    setScoreClass('defensiveScore', defensiveScore);
    
    // Generate explanation text
    let explanation = '';
    
    if (offensiveScore >= 5) {
        explanation = 'Excellent offensive coverage! ';
    } else if (offensiveScore >= 3) {
        explanation = 'Good offensive coverage. ';
    } else if (offensiveScore > 0) {
        explanation = 'Limited offensive coverage. ';
    } else {
        explanation = 'Poor offensive coverage. ';
    }
    
    if (defensiveScore >= 5) {
        explanation += 'Outstanding defensive typing!';
    } else if (defensiveScore >= 2) {
        explanation += 'Solid defensive profile.';
    } else if (defensiveScore >= 0) {
        explanation += 'Average defensive capabilities.';
    } else {
        explanation += 'Vulnerable defensive typing.';
    }
    
    document.getElementById('scoreExplanation').textContent = explanation;
}

// Set appropriate class for score display
function setScoreClass(elementId, score) {
    const element = document.getElementById(elementId);
    element.classList.remove('high-score', 'medium-score', 'low-score', 'negative-score');
    
    if (score >= 5) {
        element.classList.add('high-score');
    } else if (score >= 2) {
        element.classList.add('medium-score');
    } else if (score >= 0) {
        element.classList.add('low-score');
    } else {
        element.classList.add('negative-score');
    }
}

// Helper function to capitalize the first letter
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}