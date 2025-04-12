import attractions from "data/attractions.json";

const attractionsContainer = document.querySelector("#attraction-cards");

const displayAttractions = (attractions) => {
  attractions.forEach(attraction => {
    const sightCard = document.createElement("div");
    sightCard.classList.add("sight-card");

    const title = document.createElement("h2");
    title.textContent = attraction.name;
    sightCard.appendChild(title);

    const figure = document.createElement("figure");
    const image = document.createElement("img");
    image.src = `images/${attraction.image}`;
    image.alt = `Image of ${attraction.name}`;
    image.width = "300";
    image.height = "200";
    image.loading = "lazy";
    figure.appendChild(image);
    sightCard.appendChild(figure);

    const address = document.createElement("address");
    address.textContent = attraction.address;
    sightCard.appendChild(address);

    const description = document.createElement("p");
    description.textContent = attraction.description;
    sightCard.appendChild(description);

    const button = document.createElement("button");
    button.dataset.modal = `modal-${attraction.name.toLowerCase().replace(/\s+/g, '-')}`;
    button.textContent = "Learn More";
    sightCard.appendChild(button);

    attractionsContainer.appendChild(sightCard);
  });

  document.querySelectorAll("[data-modal]").forEach(button => {
    button.addEventListener("click", () => {
      const modalId = button.getAttribute("data-modal");
      document.getElementById(modalId).showModal();
    });
  });

  document.querySelectorAll(".close-modal").forEach(button => {
    button.addEventListener("click", () => {
      button.closest("dialog").close();
    });
  });
};

displayAttractions(attractions);

const timestampInput = document.getElementById("timestamp");
if (timestampInput) {
  const now = new Date();
  timestampInput.value = now.toLocaleString();
}

const sidebarMessage = document.createElement("div");
sidebarMessage.classList.add("visit-message");

const lastVisit = localStorage.getItem("lastVisit");
const now = Date.now();

if (!lastVisit) {
  sidebarMessage.textContent = "Welcome! Let us know if you have any questions.";
} else {
  const difference = now - lastVisit;
  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  sidebarMessage.textContent = days < 1
    ? "Back so soon! Awesome!"
    : `You last visited ${days} day${days === 1 ? "" : "s"} ago.`;
}

localStorage.setItem("lastVisit", now);
const h1 = document.querySelector("main h1");
h1.insertAdjacentElement("afterend", sidebarMessage);