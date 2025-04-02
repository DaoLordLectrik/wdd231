// Fetch Pokémon data
async function fetchPokemon() {
    const response = await fetch('https://pokeapi.co/api/v2/pokemon/pikachu');
    const data = await response.json();
    console.log(data); // Use this data to populate your UI
}

// Drag-and-drop team building
document.querySelectorAll('.team-slot').forEach(slot => {
    slot.addEventListener('drop', (e) => {
        e.preventDefault();
        const pokemonId = e.dataTransfer.getData('text/plain');
        slot.style.backgroundImage = `url('assets/img/pokemon/${pokemonId}.png')`;
    });
});