// Global variables
const API_URL = 'https://pokeapi.co/api/v2';
let allTypes = [];
let selectedPrimaryType = null;
let selectedSecondaryType = null;
let typeRelations = {};

// Type color mapping - matches the CSS variables
const typeColors = {
    normal: '#A8A878',
    fire: '#F08030',
    water: '#6890F0',
    electric: '#F8D030',
    grass: '#78C850',
    ice: '#98D8D8',
    fighting: '#C03028',
    poison: '#A040A0',
    ground: '#E0C068',
    flying: '#A890F0',
    psychic: '#F85888',
    bug: '#A8B820',
    rock: '#B8A038',
    ghost: '#705898',
    dragon: '#7038F8',
    dark: '#705848',
    steel: '#B8B8D0',
    fairy: '#EE99AC',
    none: '#DDDDDD'  // For "None" secondary type
};

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    // Set copyright year
    document.getElementById('year').textContent = new Date().getFullYear();
    
    // Set last modified date
    document.getElementById('lastModified').textContent = document.lastModified;
    
    // Mobile menu toggle
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });
    }
    
    // Initialize the type analysis page
    initializeTypePage();
});

// Initialize the type analysis page
async function initializeTypePage() {
    try {
        // Fetch all available Pokémon types
        const typeResponse = await fetch(`${API_URL}/type`);
        const typeData = await typeResponse.json();
        allTypes = typeData.results
            .filter(type => type.name !== 'unknown' && type.name !== 'shadow') // Filter out non-standard types
            .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically
        
        // Create type buttons for primary and secondary selection
        createTypeButtons();
        
        // Initialize the full type chart
        await initializeTypeChart();
    } catch (error) {
        console.error('Error initializing type page:', error);
    }
}

// Create type buttons for selection
function createTypeButtons() {
    const primaryTypeButtons = document.getElementById('primaryTypeButtons');
    const secondaryTypeButtons = document.getElementById('secondaryTypeButtons');
    
    // Clear existing buttons
    primaryTypeButtons.innerHTML = '';
    
    // Add buttons for each type
    allTypes.forEach(type => {
        // Primary type button
        const primaryButton = document.createElement('button');
        primaryButton.className = `type-button type-${type.name}`;
        primaryButton.textContent = capitalizeFirstLetter(type.name);
        primaryButton.dataset.type = type.name;
        primaryButton.addEventListener('click', () => selectPrimaryType(type.name));
        primaryTypeButtons.appendChild(primaryButton);
        
        // Secondary type button (duplicate for secondary selection)
        const secondaryButton = document.createElement('button');
        secondaryButton.className = `type-button type-${type.name}`;
        secondaryButton.textContent = capitalizeFirstLetter(type.name);
        secondaryButton.dataset.type = type.name;
        secondaryButton.addEventListener('click', () => selectSecondaryType(type.name));
        secondaryTypeButtons.appendChild(secondaryButton);
    });
    
    // Add event listener to "None" button which already exists in HTML
    const noneButton = document.querySelector('.type-button.type-none');
    if (noneButton) {
        noneButton.addEventListener('click', () => selectSecondaryType('none'));
    }
}

// Select primary type
function selectPrimaryType(typeName) {
    // Remove active class from all primary buttons
    const buttons = document.querySelectorAll('#primaryTypeButtons .type-button');
    buttons.forEach(button => button.classList.remove('active'));
    
    // Add active class to selected button
    const selectedButton = document.querySelector(`#primaryTypeButtons .type-button[data-type="${typeName}"]`);
    if (selectedButton) {
        selectedButton.classList.add('active');
    }
    
    selectedPrimaryType = typeName;
    
    // Automatically set secondary type to "none" if it's the same as primary
    if (selectedSecondaryType === selectedPrimaryType) {
        selectSecondaryType('none');
    }
    
    // If we have a primary type selected, analyze the type(s)
    if (selectedPrimaryType) {
        analyzeTypes();
    }
}

// Select secondary type
function selectSecondaryType(typeName) {
    // Remove active class from all secondary buttons
    const buttons = document.querySelectorAll('#secondaryTypeButtons .type-button');
    buttons.forEach(button => button.classList.remove('active'));
    
    // Add active class to selected button
    const selectedButton = document.querySelector(`#secondaryTypeButtons .type-button[data-type="${typeName}"]`);
    if (selectedButton) {
        selectedButton.classList.add('active');
    }
    
    // Don't allow same type for primary and secondary
    if (typeName === selectedPrimaryType) {
        selectedSecondaryType = 'none';
        const noneButton = document.querySelector('#secondaryTypeButtons .type-button[data-type="none"]');
        if (noneButton) {
            noneButton.classList.add('active');
        }
    } else {
        selectedSecondaryType = typeName;
    }
    
    // If we have a primary type selected, analyze the type(s)
    if (selectedPrimaryType) {
        analyzeTypes();
    }
}

// Analyze the selected type(s)
async function analyzeTypes() {
    if (!selectedPrimaryType) return;
    
    // Show loading indicator
    document.getElementById('loadingResults').classList.remove('hidden');
    document.getElementById('typeAnalysisResults').classList.add('hidden');
    
    try {
        // Fetch type relations for the primary type
        const primaryTypeResponse = await fetch(`${API_URL}/type/${selectedPrimaryType}`);
        const primaryTypeData = await primaryTypeResponse.json();
        
        let secondaryTypeData = null;
        if (selectedSecondaryType && selectedSecondaryType !== 'none') {
            // Fetch type relations for the secondary type
            const secondaryTypeResponse = await fetch(`${API_URL}/type/${selectedSecondaryType}`);
            secondaryTypeData = await secondaryTypeResponse.json();
        }
        
        // Calculate combined type relationships
        const typeEffectiveness = calculateTypeEffectiveness(primaryTypeData, secondaryTypeData);
        
        // Display the results
        displayTypeAnalysis(typeEffectiveness);
        
        // Find example Pokémon with these types
        await findExamplePokemon(selectedPrimaryType, selectedSecondaryType);
        
    } catch (error) {
        console.error('Error analyzing types:', error);
    } finally {
        // Hide loading indicator
        document.getElementById('loadingResults').classList.add('hidden');
        document.getElementById('typeAnalysisResults').classList.remove('hidden');
    }
}

// Calculate type effectiveness for one or two types
function calculateTypeEffectiveness(primaryTypeData, secondaryTypeData) {
    const effectiveness = {
        weakX4: [],   // Takes 4x damage from these types
        weakX2: [],   // Takes 2x damage from these types
        resistHalf: [], // Takes 0.5x damage from these types
        resistQuarter: [], // Takes 0.25x damage from these types
        immune: [],   // Takes 0x damage from these types
        superEffective: [] // Primary type does 2x damage to these types
    };
    
    // Get all type names for reference
    const allTypeNames = allTypes.map(type => type.name);
    
    // Initialize damage multipliers for all types to 1
    const damageFrom = {};
    allTypeNames.forEach(type => {
        damageFrom[type] = 1;
    });
    
    // Calculate primary type damage relations
    primaryTypeData.damage_relations.double_damage_from.forEach(type => {
        damageFrom[type.name] *= 2;
    });
    
    primaryTypeData.damage_relations.half_damage_from.forEach(type => {
        damageFrom[type.name] *= 0.5;
    });
    
    primaryTypeData.damage_relations.no_damage_from.forEach(type => {
        damageFrom[type.name] = 0;
    });
    
    // Add secondary type damage relations if applicable
    if (secondaryTypeData) {
        secondaryTypeData.damage_relations.double_damage_from.forEach(type => {
            damageFrom[type.name] *= 2;
        });
        
        secondaryTypeData.damage_relations.half_damage_from.forEach(type => {
            damageFrom[type.name] *= 0.5;
        });
        
        secondaryTypeData.damage_relations.no_damage_from.forEach(type => {
            damageFrom[type.name] = 0;
        });
    }
    
    // Categorize types by final effectiveness
    Object.entries(damageFrom).forEach(([type, multiplier]) => {
        if (multiplier === 4) {
            effectiveness.weakX4.push(type);
        } else if (multiplier === 2) {
            effectiveness.weakX2.push(type);
        } else if (multiplier === 0.5) {
            effectiveness.resistHalf.push(type);
        } else if (multiplier === 0.25) {
            effectiveness.resistQuarter.push(type);
        } else if (multiplier === 0) {
            effectiveness.immune.push(type);
        }
    });
    
    // Get super effective moves for offensive analysis
    primaryTypeData.damage_relations.double_damage_to.forEach(type => {
        effectiveness.superEffective.push(type.name);
    });
    
    if (secondaryTypeData) {
        secondaryTypeData.damage_relations.double_damage_to.forEach(type => {
            if (!effectiveness.superEffective.includes(type.name)) {
                effectiveness.superEffective.push(type.name);
            }
        });
    }
    
    return effectiveness;
}

// Display the type analysis results
function displayTypeAnalysis(typeEffectiveness) {
    // Update the analyzed type text
    const typeText = selectedSecondaryType && selectedSecondaryType !== 'none' 
        ? `${capitalizeFirstLetter(selectedPrimaryType)}/${capitalizeFirstLetter(selectedSecondaryType)}`
        : capitalizeFirstLetter(selectedPrimaryType);
    
    document.getElementById('analyzedType').textContent = typeText;
    
    // Helper function to display type badges
    const displayBadges = (containerId, types) => {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        
        if (types.length === 0) {
            container.innerHTML = '<p class="empty-result">None</p>';
            return;
        }
        
        types.forEach(type => {
            const badge = document.createElement('span');
            badge.className = `type-badge type-${type}`;
            badge.textContent = capitalizeFirstLetter(type);
            container.appendChild(badge);
        });
    };
    
    // Display all effectiveness categories
    displayBadges('weakX4', typeEffectiveness.weakX4);
    displayBadges('weakX2', typeEffectiveness.weakX2);
    displayBadges('resistHalf', typeEffectiveness.resistHalf);
    displayBadges('resistQuarter', typeEffectiveness.resistQuarter);
    displayBadges('immune', typeEffectiveness.immune);
    displayBadges('superEffective', typeEffectiveness.superEffective);
}

// Find example Pokémon with the selected type combination
async function findExamplePokemon(primaryType, secondaryType) {
    const exampleContainer = document.getElementById('examplePokemon');
    exampleContainer.innerHTML = '<p>Loading examples...</p>';
    
    try {
        // Fetch Pokémon for the primary type
        const typeResponse = await fetch(`${API_URL}/type/${primaryType}`);
        const typeData = await typeResponse.json();
        let matchingPokemon = typeData.pokemon.map(p => p.pokemon);
        
        // If secondary type is selected, filter further
        if (secondaryType && secondaryType !== 'none') {
            const secondaryTypeResponse = await fetch(`${API_URL}/type/${secondaryType}`);
            const secondaryTypeData = await secondaryTypeResponse.json();
            const secondaryPokemonNames = secondaryTypeData.pokemon.map(p => p.pokemon.name);
            
            // Filter to Pokémon that have both types
            matchingPokemon = matchingPokemon.filter(p => 
                secondaryPokemonNames.includes(p.name)
            );
        }
        
        // Take up to 6 examples, prioritizing popular generations
        let examples = matchingPokemon.slice(0, 6);
        
        // No Pokémon found with this combination
        if (examples.length === 0) {
            exampleContainer.innerHTML = '<p>No Pokémon found with this type combination.</p>';
            return;
        }
        
        // Fetch details for each example Pokémon
        exampleContainer.innerHTML = '';
        
        // Load at most 6 Pokémon
        const pokemonToShow = examples.slice(0, 6);
        
        for (const pokemon of pokemonToShow) {
            try {
                const pokemonResponse = await fetch(pokemon.url);
                const pokemonData = await pokemonResponse.json();
                
                const exampleCard = document.createElement('div');
                exampleCard.className = 'example-card';
                
                const sprite = pokemonData.sprites.front_default || 'images/poke-ball.webp';
                
                exampleCard.innerHTML = `
                    <img src="${sprite}" alt="${pokemonData.name}">
                    <div class="example-name">${formatPokemonName(pokemonData.name)}</div>
                `;
                
                exampleContainer.appendChild(exampleCard);
            } catch (err) {
                console.error(`Error fetching Pokémon ${pokemon.name}:`, err);
            }
        }
    } catch (error) {
        console.error('Error finding example Pokémon:', error);
        exampleContainer.innerHTML = '<p>Error loading example Pokémon.</p>';
    }
}

// // Initialize the full type chart
// async function initializeTypeChart() {
//     // Cache the type relations to avoid duplicate API calls
//     for (const type of allTypes) {
//         try {
//             const response = await fetch(`${API_URL}/type/${type.name}`);
//             const typeData = await response.json();
//             typeRelations[type.name] = typeData.damage_relations;
//         } catch (error) {
//             console.error(`Error fetching relations for ${type.name}:`, error);
//         }
//     }
    
//     // Create the table
//     const table = document.getElementById('fullTypeChart');
//     const thead = table.querySelector('thead tr');
//     const tbody = table.querySelector('tbody');
    
//     // Add column headers (defending types)
//     allTypes.forEach(type => {
//         const th = document.createElement('th');
//         th.className = `type-${type.name}`;
//         th.textContent = capitalizeFirstLetter(type.name);
//         thead.appendChild(th);
//     });
    
//     // Add rows (attacking types)
//     allTypes.forEach(attackingType => {
//         const row = document.createElement('tr');
        
//         // Add row header (attacking type)
//         const th = document.createElement('th');
//         th.className = `type-${attackingType.name}`;
//         th.textContent = capitalizeFirstLetter(attackingType.name);
//         row.appendChild(th);
        
//         // Add cells for each defending type
//         allTypes.forEach(defendingType => {
//             const cell = document.createElement('td');
//             const effectiveness = getTypeEffectiveness(attackingType.name, defendingType.name);
            
//             cell.textContent = effectiveness;
            
//             // Add class based on effectiveness
//             if (effectiveness === '2×') {
//                 cell.className = 'super-effective';
//             } else if (effectiveness === '½×') {
//                 cell.className = 'not-very-effective';
//             } else if (effectiveness === '0×') {
//                 cell.className = 'no-effect';
//             }
            
//             row.appendChild(cell);
//         });
        
//         tbody.appendChild(row);
//     });
// }

// Get type effectiveness between two types
function getTypeEffectiveness(attackingType, defendingType) {
    const relations = typeRelations[attackingType];
    
    if (!relations) return '1×'; // Default if not found
    
    // Check immunities (no damage)
    if (relations.no_damage_to.some(type => type.name === defendingType)) {
        return '0×';
    }
    
    // Check super effective (double damage)
    if (relations.double_damage_to.some(type => type.name === defendingType)) {
        return '2×';
    }
    
    // Check not very effective (half damage)
    if (relations.half_damage_to.some(type => type.name === defendingType)) {
        return '½×';
    }
    
    // Normal effectiveness
    return '1×';
}

// Helper function to capitalize first letter
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Helper function to format Pokémon names
function formatPokemonName(name) {
    // Capitalize and replace hyphens with spaces
    return name
        .split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}