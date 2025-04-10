// Global Variables
const API_URL = 'https://pokeapi.co/api/v2';
let currentPage = 1;
const POKEMON_PER_PAGE = 20;
let totalPokemon = 0;
let currentFilters = {
    search: '',
    type: '',
    generation: ''
};
let allPokemon = [];
let filteredPokemon = [];
let viewMode = 'grid';

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
    
    // Pokedex elements
    const searchInput = document.getElementById('pokedexSearch');
    const typeFilter = document.getElementById('typeFilter');
    const generationFilter = document.getElementById('generationFilter');
    const searchButton = document.getElementById('searchPokedex');
    const prevPageButton = document.getElementById('prevPage');
    const nextPageButton = document.getElementById('nextPage');
    const viewModeSelect = document.getElementById('viewMode');
    
    // Modal elements
    const modal = document.getElementById('pokemonModal');
    const closeModal = document.querySelector('.close-modal');
    const addToTeamButton = document.getElementById('addToTeam');
    
    // Initialize Pokedex
    initializePokedex();
    
    // Event listeners
    if (searchButton) {
        searchButton.addEventListener('click', function() {
            currentFilters.search = searchInput.value.trim().toLowerCase();
            currentFilters.type = typeFilter.value;
            currentFilters.generation = generationFilter.value;
            currentPage = 1;
            applyFilters();
        });
    }
    
    if (prevPageButton) {
        prevPageButton.addEventListener('click', function() {
            if (currentPage > 1) {
                currentPage--;
                displayPokemonList();
            }
        });
    }
    
    if (nextPageButton) {
        nextPageButton.addEventListener('click', function() {
            if (currentPage * POKEMON_PER_PAGE < filteredPokemon.length) {
                currentPage++;
                displayPokemonList();
            }
        });
    }
    
    if (viewModeSelect) {
        viewModeSelect.addEventListener('change', function() {
            viewMode = this.value;
            const pokemonList = document.getElementById('pokemonList');
            
            if (viewMode === 'grid') {
                pokemonList.className = 'pokemon-grid';
            } else {
                pokemonList.className = 'pokemon-list';
            }
            
            displayPokemonList();
        });
    }
    
    // Modal events
    if (closeModal) {
        closeModal.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Add to team button
    if (addToTeamButton) {
        addToTeamButton.addEventListener('click', function() {
            const pokemonId = this.getAttribute('data-pokemon-id');
            addPokemonToTeam(pokemonId);
        });
    }
});

// Initialize Pokedex
async function initializePokedex() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    loadingIndicator.style.display = 'block';
    
    try {
        // Fetch all Pokemon (limited to 1000 for performance)
        const response = await fetch(`${API_URL}/pokemon?limit=1000`);
        const data = await response.json();
        
        totalPokemon = data.count;
        allPokemon = data.results.map((pokemon, index) => {
            // Extract ID from URL
            const id = index + 1;
            return {
                id: id,
                name: pokemon.name,
                url: pokemon.url
            };
        });
        
        // Initialize filtered list with all Pokemon
        filteredPokemon = [...allPokemon];
        
        // Display first page
        displayPokemonList();
        
        // Load type filter options
        loadTypeOptions();
        
        // Load generation filter options
        loadGenerationOptions();
        
    } catch (error) {
        console.error('Error initializing Pokedex:', error);
        const pokemonList = document.getElementById('pokemonList');
        pokemonList.innerHTML = '<p>Error loading Pokémon data. Please refresh the page to try again.</p>';
    } finally {
        loadingIndicator.style.display = 'none';
    }
}

// Apply filters to Pokemon list
async function applyFilters() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    loadingIndicator.style.display = 'block';
    
    try {
        // Start with all Pokemon
        filteredPokemon = [...allPokemon];
        
        // Apply name search filter
        if (currentFilters.search) {
            filteredPokemon = filteredPokemon.filter(pokemon => 
                pokemon.name.includes(currentFilters.search)
            );
        }
        
        // Apply type filter
        if (currentFilters.type) {
            const typeResponse = await fetch(`${API_URL}/type/${currentFilters.type}`);
            const typeData = await typeResponse.json();
            
            const typeFilteredPokemon = typeData.pokemon.map(p => {
                // Extract ID from URL
                const urlParts = p.pokemon.url.split('/');
                const id = parseInt(urlParts[urlParts.length - 2]);
                return id;
            });
            
            filteredPokemon = filteredPokemon.filter(pokemon => 
                typeFilteredPokemon.includes(pokemon.id)
            );
        }
        
        // Apply generation filter
        if (currentFilters.generation) {
            const genResponse = await fetch(`${API_URL}/generation/${currentFilters.generation}`);
            const genData = await genResponse.json();
            
            const genPokemonSpecies = genData.pokemon_species.map(species => {
                // Extract name from species
                return species.name;
            });
            
            filteredPokemon = filteredPokemon.filter(pokemon => 
                genPokemonSpecies.includes(pokemon.name)
            );
        }
        
        // Reset to first page and display results
        currentPage = 1;
        displayPokemonList();
        
    } catch (error) {
        console.error('Error applying filters:', error);
        const pokemonList = document.getElementById('pokemonList');
        pokemonList.innerHTML = '<p>Error filtering Pokémon. Please try again.</p>';
    } finally {
        loadingIndicator.style.display = 'none';
    }
}

// Display Pokemon list with pagination
async function displayPokemonList() {
    const pokemonList = document.getElementById('pokemonList');
    const paginationInfo = document.getElementById('paginationInfo');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const prevPageButton = document.getElementById('prevPage');
    const nextPageButton = document.getElementById('nextPage');
    
    loadingIndicator.style.display = 'block';
    pokemonList.innerHTML = '';
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * POKEMON_PER_PAGE;
    const endIndex = Math.min(startIndex + POKEMON_PER_PAGE, filteredPokemon.length);
    const currentPagePokemon = filteredPokemon.slice(startIndex, endIndex);
    
    // Update pagination info
    paginationInfo.textContent = `Showing ${startIndex + 1}-${endIndex} of ${filteredPokemon.length} Pokémon`;
    
    // Update pagination buttons
    prevPageButton.disabled = currentPage === 1;
    nextPageButton.disabled = endIndex >= filteredPokemon.length;
    
    try {
        // Load pokemon details for current page
        for (const pokemon of currentPagePokemon) {
            const response = await fetch(`${API_URL}/pokemon/${pokemon.id}`);
            const pokemonData = await response.json();
            
            // Create Pokemon list item
            const listItem = document.createElement('div');
            listItem.className = viewMode === 'grid' ? 'pokemon-card pokemon-list-item' : 'pokemon-row pokemon-list-item';
            listItem.dataset.id = pokemon.id;
            
            // Get sprite
            const sprite = pokemonData.sprites.front_default || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png';
            
            // Get types
            let typesHTML = '';
            pokemonData.types.forEach(type => {
                typesHTML += `<span class="type-badge type-${type.type.name}">${type.type.name}</span>`;
            });
            
            // Different layout for grid vs list view
            if (viewMode === 'grid') {
                listItem.innerHTML = `
                    <img src="${sprite}" alt="${pokemon.name}" class="pokemon-image">
                    <div class="pokemon-number">#${pokemon.id.toString().padStart(3, '0')}</div>
                    <div class="pokemon-name">${formatPokemonName(pokemon.name)}</div>
                    <div class="pokemon-types">${typesHTML}</div>
                `;
            } else {
                listItem.innerHTML = `
                    <div class="pokemon-row-info">
                        <img src="${sprite}" alt="${pokemon.name}" class="pokemon-image">
                        <div class="pokemon-info">
                            <div class="pokemon-number">#${pokemon.id.toString().padStart(3, '0')}</div>
                            <div class="pokemon-name">${formatPokemonName(pokemon.name)}</div>
                            <div class="pokemon-types">${typesHTML}</div>
                        </div>
                    </div>
                    <div class="pokemon-stats-preview">
                        <div class="stat-bar">
                            <span class="stat-name">HP</span>
                            <div class="stat-bar-outer">
                                <div class="stat-bar-inner" style="width: ${Math.min(100, pokemonData.stats[0].base_stat / 2)}%"></div>
                            </div>
                            <span class="stat-value">${pokemonData.stats[0].base_stat}</span>
                        </div>
                        <div class="stat-bar">
                            <span class="stat-name">ATK</span>
                            <div class="stat-bar-outer">
                                <div class="stat-bar-inner" style="width: ${Math.min(100, pokemonData.stats[1].base_stat / 2)}%"></div>
                            </div>
                            <span class="stat-value">${pokemonData.stats[1].base_stat}</span>
                        </div>
                        <div class="stat-bar">
                            <span class="stat-name">DEF</span>
                            <div class="stat-bar-outer">
                                <div class="stat-bar-inner" style="width: ${Math.min(100, pokemonData.stats[2].base_stat / 2)}%"></div>
                            </div>
                            <span class="stat-value">${pokemonData.stats[2].base_stat}</span>
                        </div>
                    </div>
                `;
            }
            
            // Add click event to show details
            listItem.addEventListener('click', function() {
                showPokemonDetails(pokemon.id);
            });
            
            // Add animation class after a small delay for staggered effect
            setTimeout(() => {
                listItem.classList.add('animate');
            }, 50 * (pokemonList.children.length));
            
            pokemonList.appendChild(listItem);
        }
        
    } catch (error) {
        console.error('Error displaying Pokemon list:', error);
        pokemonList.innerHTML = '<p>Error loading Pokémon. Please try again.</p>';
    } finally {
        loadingIndicator.style.display = 'none';
    }
}

// Show Pokemon details in modal
async function showPokemonDetails(pokemonId) {
    const modal = document.getElementById('pokemonModal');
    const modalContent = document.querySelector('.pokemon-details');
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading';
    loadingIndicator.innerHTML = '<img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png" alt="Loading..." class="spinning"><p>Loading details...</p>';
    
    modalContent.innerHTML = '';
    modalContent.appendChild(loadingIndicator);
    modal.style.display = 'block';
    
    try {
        // Fetch Pokemon details
        const response = await fetch(`${API_URL}/pokemon/${pokemonId}`);
        const pokemon = await response.json();
        
        // Fetch species details for description
        const speciesResponse = await fetch(pokemon.species.url);
        const species = await speciesResponse.json();
        
        // Find English description
        let description = 'No description available.';
        const englishEntries = species.flavor_text_entries.filter(entry => entry.language.name === 'en');
        if (englishEntries.length > 0) {
            description = englishEntries[0].flavor_text.replace(/\f/g, ' ');
        }
        
        // Get types
        let typesHTML = '';
        pokemon.types.forEach(type => {
            typesHTML += `<span class="type-badge type-${type.type.name}">${type.type.name}</span>`;
        });
        
        // Get stats
        let statsHTML = '';
        const statNames = {
            'hp': 'HP',
            'attack': 'Attack',
            'defense': 'Defense',
            'special-attack': 'Sp. Atk',
            'special-defense': 'Sp. Def',
            'speed': 'Speed'
        };
        
        pokemon.stats.forEach(stat => {
            const statName = statNames[stat.stat.name] || stat.stat.name;
            const percentage = Math.min(100, stat.base_stat / 2);
            
            statsHTML += `
                <div class="stat-bar">
                    <span class="stat-name">${statName}</span>
                    <div class="stat-bar-outer">
                        <div class="stat-bar-inner" style="width: ${percentage}%"></div>
                    </div>
                    <span class="stat-value">${stat.base_stat}</span>
                </div>
            `;
        });
        
        // Get abilities
        let abilitiesHTML = '';
        pokemon.abilities.forEach(ability => {
            abilitiesHTML += `
                <div class="ability-item">
                    <span class="ability-name">${formatPokemonName(ability.ability.name)}</span>
                    ${ability.is_hidden ? '<span class="ability-hidden">Hidden</span>' : ''}
                </div>
            `;
        });
        
        // Get moves (limited to 20 for performance)
        let movesHTML = '';
        const limitedMoves = pokemon.moves.slice(0, 20);
        limitedMoves.forEach(move => {
            movesHTML += `<div class="move-item">${formatPokemonName(move.move.name)}</div>`;
        });
        
        // Create modal content
        modalContent.innerHTML = `
            <div class="pokemon-detail-image">
                <img src="${pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default}" alt="${pokemon.name}">
            </div>
            <div class="pokemon-detail-info">
                <h2 class="pokemon-detail-name">${formatPokemonName(pokemon.name)}</h2>
                <p class="pokemon-detail-number">#${pokemon.id.toString().padStart(3, '0')}</p>
                <div class="pokemon-detail-types">${typesHTML}</div>
                <p class="pokemon-description">${description}</p>
                
                <div class="pokemon-details-grid">
                    <div class="detail-group">
                        <p><strong>Height:</strong> ${pokemon.height / 10} m</p>
                        <p><strong>Weight:</strong> ${pokemon.weight / 10} kg</p>
                    </div>
                    <div class="detail-group">
                        <p><strong>Base Experience:</strong> ${pokemon.base_experience}</p>
                        <p><strong>Generation:</strong> ${formatGeneration(species.generation.name)}</p>
                    </div>
                </div>

                <h3>Base Stats</h3>
                <div class="pokemon-stats">
                    ${statsHTML}
                </div>
                
                <h3>Abilities</h3>
                <div class="pokemon-abilities">
                    ${abilitiesHTML}
                </div>
                
                <h3>Moves</h3>
                <div class="move-list">
                    ${movesHTML}
                </div>
                
                <div class="modal-actions">
                    <button class="btn btn-primary" id="addToTeam" data-pokemon-id="${pokemon.id}">Add to Team</button>
                </div>
            </div>
        `;
        
        // Add event listener for Add to Team button
        document.getElementById('addToTeam').addEventListener('click', function() {
            addPokemonToTeam(pokemon.id);
        });
        
    } catch (error) {
        console.error('Error showing Pokemon details:', error);
        modalContent.innerHTML = '<p>Error loading Pokémon details. Please try again.</p>';
    }
}

// Load type filter options
async function loadTypeOptions() {
    const typeFilter = document.getElementById('typeFilter');
    
    try {
        const response = await fetch(`${API_URL}/type`);
        const data = await response.json();
        
        // Add default option
        typeFilter.innerHTML = '<option value="">All Types</option>';
        
        // Add type options
        data.results.forEach(type => {
            // Skip 'unknown' and 'shadow' types
            if (type.name !== 'unknown' && type.name !== 'shadow') {
                const option = document.createElement('option');
                option.value = type.name;
                option.textContent = type.name.charAt(0).toUpperCase() + type.name.slice(1);
                typeFilter.appendChild(option);
            }
        });
        
    } catch (error) {
        console.error('Error loading type options:', error);
    }
}

// Load generation filter options
async function loadGenerationOptions() {
    const generationFilter = document.getElementById('generationFilter');
    
    try {
        const response = await fetch(`${API_URL}/generation`);
        const data = await response.json();
        
        // Add default option
        generationFilter.innerHTML = '<option value="">All Generations</option>';
        
        // Add generation options
        data.results.forEach(gen => {
            const option = document.createElement('option');
            option.value = gen.name.split('-')[1]; // Extract generation number
            option.textContent = formatGeneration(gen.name);
            generationFilter.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error loading generation options:', error);
    }
}

// Add Pokemon to team (redirects to team builder)
function addPokemonToTeam(pokemonId) {
    // Check if we have local storage to save the Pokemon
    if (typeof localStorage !== 'undefined') {
        // Fetch the current team from local storage
        let team = [];
        const savedTeam = localStorage.getItem('pokeSquadTeam');
        
        if (savedTeam) {
            team = JSON.parse(savedTeam);
        }
        
        // Check if team is full
        if (team.length >= 6) {
            alert('Your team is already full! Remove a Pokémon first.');
            return;
        }
        
        // Check if Pokemon is already in team
        const existingPokemon = team.find(p => p.id === parseInt(pokemonId));
        if (existingPokemon) {
            alert('This Pokémon is already in your team!');
            return;
        }
        
        // Add Pokemon ID to team for later processing
        fetch(`${API_URL}/pokemon/${pokemonId}`)
            .then(response => response.json())
            .then(pokemon => {
                team.push({
                    id: pokemon.id,
                    name: pokemon.name,
                    sprite: pokemon.sprites.front_default,
                    types: pokemon.types.map(t => t.type.name),
                    stats: pokemon.stats.reduce((acc, stat) => {
                        acc[stat.stat.name] = stat.base_stat;
                        return acc;
                    }, {})
                });
                
                // Save team back to local storage
                localStorage.setItem('pokeSquadTeam', JSON.stringify(team));
                
                // Show success message
                alert(`${formatPokemonName(pokemon.name)} added to your team!`);
                
                // Offer to redirect to team builder
                if (confirm('View your team now?')) {
                    window.location.href = 'index.html#team-builder';
                }
            })
            .catch(error => {
                console.error('Error adding Pokemon to team:', error);
                alert('Error adding Pokémon to team. Please try again.');
            });
    } else {
        alert('Your browser does not support local storage. Unable to save team.');
    }
}

// Helper function to format Pokemon names
function formatPokemonName(name) {
    // Capitalize and replace hyphens with spaces
    return name
        .split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

// Helper function to format generation names
function formatGeneration(genName) {
    const parts = genName.split('-');
    const genNumber = parts[1];
    return `Generation ${genNumber.toUpperCase()}`;
}