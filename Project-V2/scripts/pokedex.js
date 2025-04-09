// Global Variables
const API_URL = 'https://pokeapi.co/api/v2';
let currentTeam = [];
const MAX_TEAM_SIZE = 6;

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    // Set copyright year
    document.getElementById('year').textContent = new Date().getFullYear();
    
    // Set last modified date
    document.getElementById('lastModified').textContent = new Date().toLocaleDateString();
    
    // Mobile menu toggle
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });
    }
    
    // Search functionality (if on home page)
    const searchInput = document.getElementById('pokemonSearch');
    const searchButton = document.getElementById('searchButton');
    const searchResults = document.getElementById('searchResults');
    
    if (searchButton && searchInput) {
        searchButton.addEventListener('click', function() {
            searchPokemon(searchInput.value.trim().toLowerCase());
        });
        
        searchInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                searchPokemon(searchInput.value.trim().toLowerCase());
            }
        });
    }
    
    // Team management (if on home page)
    const clearTeamButton = document.getElementById('clearTeam');
    const analyzeTeamButton = document.getElementById('analyzeTeam');
    
    if (clearTeamButton) {
        clearTeamButton.addEventListener('click', clearTeam);
    }
    
    if (analyzeTeamButton) {
        analyzeTeamButton.addEventListener('click', analyzeTeam);
    }
    
    // Load team from local storage
    loadTeamFromStorage();
    
    // Template buttons
    const templateButtons = document.querySelectorAll('.template-load');
    templateButtons.forEach(button => {
        button.addEventListener('click', function() {
            const template = this.getAttribute('data-template');
            loadTeamTemplate(template);
        });
    });
});

// Search for Pokémon
async function searchPokemon(query) {
    if (!query) return;
    
    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = '<div class="loading"><img src="images/poke-ball.webp" alt="Loading..." class="spinning"><p>Searching...</p></div>';
    
    try {
        // Try to fetch directly by name or ID
        const response = await fetch(`${API_URL}/pokemon/${query}`);
        
        if (response.ok) {
            const pokemon = await response.json();
            displaySearchResults([pokemon]);
        } else {
            // If direct search fails, search in list
            const listResponse = await fetch(`${API_URL}/pokemon?limit=1000`);
            const data = await listResponse.json();
            
            const filteredResults = data.results.filter(p => 
                p.name.includes(query)
            ).slice(0, 10); // Limit to 10 results
            
            if (filteredResults.length === 0) {
                searchResults.innerHTML = '<p>No Pokémon found. Try a different search term.</p>';
                return;
            }
            
            // Fetch details for each result
            const pokemonPromises = filteredResults.map(p => 
                fetch(p.url).then(res => res.json())
            );
            
            const pokemonList = await Promise.all(pokemonPromises);
            displaySearchResults(pokemonList);
        }
    } catch (error) {
        console.error('Error searching for Pokémon:', error);
        searchResults.innerHTML = '<p>Error searching for Pokémon. Please try again.</p>';
    }
}

// Display search results
function displaySearchResults(pokemonList) {
    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = '';
    
    pokemonList.forEach(pokemon => {
        const card = document.createElement('div');
        card.className = 'pokemon-card';
        card.dataset.id = pokemon.id;
        
        const sprite = pokemon.sprites.front_default || 'images/poke-ball.webp';
        
        let typesHTML = '';
        pokemon.types.forEach(type => {
            typesHTML += `<span class="type-badge type-${type.type.name}">${type.type.name}</span>`;
        });
        
        card.innerHTML = `
            <img src="${sprite}" alt="${pokemon.name}">
            <div class="pokemon-name">${formatPokemonName(pokemon.name)}</div>
            <div class="pokemon-types">${typesHTML}</div>
        `;
        
        card.addEventListener('click', () => {
            addPokemonToTeam(pokemon);
        });
        
        searchResults.appendChild(card);
    });
}

// Add Pokémon to team
function addPokemonToTeam(pokemon) {
    if (currentTeam.length >= MAX_TEAM_SIZE) {
        alert('Your team is already full! Remove a Pokémon first.');
        return;
    }
    
    // Check if the Pokémon is already in the team
    const existingPokemon = currentTeam.find(p => p.id === pokemon.id);
    if (existingPokemon) {
        alert(`${formatPokemonName(pokemon.name)} is already in your team!`);
        return;
    }
    
    currentTeam.push({
        id: pokemon.id,
        name: pokemon.name,
        sprite: pokemon.sprites.front_default || 'images/poke-ball.webp',
        types: pokemon.types.map(t => t.type.name),
        stats: pokemon.stats.reduce((acc, stat) => {
            acc[stat.stat.name] = stat.base_stat;
            return acc;
        }, {})
    });
    
    updateTeamDisplay();
    saveTeamToStorage();
}

// Update team display
function updateTeamDisplay() {
    const teamContainer = document.getElementById('teamContainer');
    if (!teamContainer) return;
    
    // Clear existing team slots
    const slots = teamContainer.querySelectorAll('.team-slot');
    slots.forEach((slot, index) => {
        const position = slot.dataset.position;
        const pokemon = currentTeam[position];
        
        if (pokemon) {
            slot.classList.remove('empty');
            slot.innerHTML = `
                <img src="${pokemon.sprite}" alt="${pokemon.name}">
                <div class="remove-pokemon" data-position="${position}">×</div>
            `;
        } else {
            slot.classList.add('empty');
            slot.innerHTML = '<span>+</span>';
        }
    });
    
    // Add event listeners for removing Pokémon
    const removeButtons = document.querySelectorAll('.remove-pokemon');
    removeButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const position = this.dataset.position;
            removePokemonFromTeam(position);
        });
    });
}

// Remove Pokémon from team
function removePokemonFromTeam(position) {
    currentTeam.splice(position, 1);
    updateTeamDisplay();
    saveTeamToStorage();
}

// Clear the team
function clearTeam() {
    if (currentTeam.length === 0) return;
    
    if (confirm('Are you sure you want to clear your team?')) {
        currentTeam = [];
        updateTeamDisplay();
        saveTeamToStorage();
        
        // Hide analysis if showing
        const teamAnalysis = document.getElementById('teamAnalysis');
        if (teamAnalysis) {
            teamAnalysis.classList.add('hidden');
        }
    }
}

// Analyze team
async function analyzeTeam() {
    if (currentTeam.length === 0) {
        alert('Add Pokémon to your team first!');
        return;
    }
    
    const teamAnalysis = document.getElementById('teamAnalysis');
    const typeCoverageChart = document.getElementById('typeCoverageChart');
    const weaknessChart = document.getElementById('weaknessChart');
    
    teamAnalysis.classList.remove('hidden');
    typeCoverageChart.innerHTML = '<div class="loading"><img src="images/poke-ball.webp" alt="Loading..." class="spinning"><p>Analyzing...</p></div>';
    weaknessChart.innerHTML = '';
    
    try {
        // Get type data
        const typeResponse = await fetch(`${API_URL}/type`);
        const typeData = await typeResponse.json();
        const types = typeData.results;
        
        // Calculate type coverage
        const coverage = {};
        const weaknesses = {};
        
        // Initialize coverage and weaknesses for all types
        types.forEach(type => {
            coverage[type.name] = 0;
            weaknesses[type.name] = 0;
        });
        
        // Fetch type relations for each Pokémon's types
        for (const pokemon of currentTeam) {
            for (const type of pokemon.types) {
                const typeDetailResponse = await fetch(`${API_URL}/type/${type}`);
                const typeDetail = await typeDetailResponse.json();
                
                // Add covered types
                typeDetail.damage_relations.double_damage_to.forEach(t => {
                    coverage[t.name]++;
                });
                
                // Add weaknesses
                typeDetail.damage_relations.double_damage_from.forEach(t => {
                    weaknesses[t.name]++;
                });
            }
        }
        
        // Display type coverage
        displayTypeCoverage(coverage);
        
        // Display weaknesses
        displayWeaknesses(weaknesses);
        
    } catch (error) {
        console.error('Error analyzing team:', error);
        typeCoverageChart.innerHTML = '<p>Error analyzing team. Please try again.</p>';
    }
}

// Display type coverage chart
function displayTypeCoverage(coverage) {
    const typeCoverageChart = document.getElementById('typeCoverageChart');
    typeCoverageChart.innerHTML = '';
    
    // Filter out unused types and sort by coverage
    const sortedTypes = Object.entries(coverage)
        .filter(([_, count]) => count > 0)
        .sort((a, b) => b[1] - a[1]);
    
    if (sortedTypes.length === 0) {
        typeCoverageChart.innerHTML = '<p>Your team doesn\'t have offensive coverage against any types yet.</p>';
        return;
    }
    
    // Create type coverage items
    sortedTypes.forEach(([type, count]) => {
        const typeItem = document.createElement('div');
        typeItem.className = `type-item type-${type}`;
        typeItem.innerHTML = `
            <span class="type-score">${count}</span>
            <span class="type-name">${type}</span>
        `;
        typeCoverageChart.appendChild(typeItem);
    });
}

// Display weaknesses chart
function displayWeaknesses(weaknesses) {
    const weaknessChart = document.getElementById('weaknessChart');
    weaknessChart.innerHTML = '';
    
    // Filter out unused types and sort by weakness count
    const sortedWeaknesses = Object.entries(weaknesses)
        .filter(([_, count]) => count > 0)
        .sort((a, b) => b[1] - a[1]);
    
    if (sortedWeaknesses.length === 0) {
        weaknessChart.innerHTML = '<p>Your team doesn\'t have any type weaknesses!</p>';
        return;
    }
    
    // Create weakness items
    sortedWeaknesses.forEach(([type, count]) => {
        const typeItem = document.createElement('div');
        typeItem.className = `type-item type-${type}`;
        typeItem.innerHTML = `
            <span class="type-score">${count}</span>
            <span class="type-name">${type}</span>
        `;
        weaknessChart.appendChild(typeItem);
    });
}

// Load team template
async function loadTeamTemplate(templateName) {
    if (currentTeam.length > 0) {
        if (!confirm('This will replace your current team. Continue?')) {
            return;
        }
    }
    
    let templatePokemon = [];
    
    if (templateName === 'story') {
        templatePokemon = [6, 9, 31, 59, 65, 143]; // Charizard, Blastoise, Nidoqueen, Arcanine, Alakazam, Snorlax
    } else if (templateName === 'rain') {
        templatePokemon = [186, 134, 121, 130, 103, 141]; // Politoed, Vaporeon, Starmie, Gyarados, Exeggutor, Kabutops
    }
    
    currentTeam = [];
    
    try {
        // Fetch each Pokémon
        for (const id of templatePokemon) {
            const response = await fetch(`${API_URL}/pokemon/${id}`);
            const pokemon = await response.json();
            
            currentTeam.push({
                id: pokemon.id,
                name: pokemon.name,
                sprite: pokemon.sprites.front_default,
                types: pokemon.types.map(t => t.type.name),
                stats: pokemon.stats.reduce((acc, stat) => {
                    acc[stat.stat.name] = stat.base_stat;
                    return acc;
                }, {})
            });
        }
        
        updateTeamDisplay();
        saveTeamToStorage();
        analyzeTeam();
        
    } catch (error) {
        console.error('Error loading template:', error);
        alert('Error loading template. Please try again.');
    }
}

// Save team to local storage
function saveTeamToStorage() {
    localStorage.setItem('pokeSquadTeam', JSON.stringify(currentTeam));
}

// Load team from local storage
function loadTeamFromStorage() {
    const savedTeam = localStorage.getItem('pokeSquadTeam');
    if (savedTeam) {
        currentTeam = JSON.parse(savedTeam);
        updateTeamDisplay();
    }
}

// Helper function to format Pokémon names
function formatPokemonName(name) {
    // Capitalize and replace hyphens with spaces
    return name
        .split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}