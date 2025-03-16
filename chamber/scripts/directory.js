const membersContainer = document.querySelector("#members");

const url = "data/members.json";

async function fetchMembers() {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const companies = await response.json();
    displayMembers(companies);
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

function displayMembers(companies) {
  membersContainer.innerHTML = "";
  
  companies.forEach(company => {
    let card = document.createElement("div");
    card.classList.add("member-card");

    let name = document.createElement("h2");
    name.textContent = company.name;

    let address = document.createElement("p");
    address.textContent = `Address: ${company.address}`;

    let phone = document.createElement("p");
    phone.textContent = `Phone: ${company.phone}`;

    let website = document.createElement("a");
    website.href = company.website;
    website.textContent = "Visit Website";
    website.target = "_blank";

    let membershipLevel = document.createElement("p");
    let levelText = company.membership_level === 3 ? "Gold" :
                    company.membership_level === 2 ? "Silver" :
                    "Member";
    membershipLevel.textContent = `Membership: ${levelText}`;

    let image = document.createElement("img");
    image.src = company.imageurl;
    image.alt = `Logo of ${company.name}`;
    image.loading = "lazy";

    card.appendChild(name);
    card.appendChild(image);
    card.appendChild(address);
    card.appendChild(phone);
    card.appendChild(membershipLevel);
    card.appendChild(website);

    membersContainer.appendChild(card);
  });
}

fetchMembers();