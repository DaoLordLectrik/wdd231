const membersContainer = document.querySelector("#members");
const url = "data/members.json";

async function getMembers() {
  const response = await fetch(url);
  const data = await response.json();

  const level1 = data.filter(company => company.membership_level === 1);
  const level2 = data.filter(company => company.membership_level === 2);

  const combined = [...level1, ...level2];
  const shuffled = combined.sort(() => Math.random() - 0.5);

  const selectedMembers = shuffled.slice(0, 3);

  displayMembers(selectedMembers);
}

getMembers();

const displayMembers = (companies) => {
  membersContainer.innerHTML = "";

  companies.forEach(company => {
    const card = document.createElement("section");
    card.classList.add("member-card");

    const name = document.createElement("h2");
    const image = document.createElement("img");
    const address = document.createElement("p");
    const phone = document.createElement("p");
    const website = document.createElement("a");
    const membershipLevel = document.createElement("p");

    name.textContent = company.name;
    address.textContent = company.address;
    phone.textContent = company.phone;
    website.href = company.website;
    website.textContent = company.website;
    website.target = "_blank";

    const levelLabel = company.membership_level === 1 ? "Gold Member" : "Silver Member";

    image.setAttribute("src", company.imageurl);
    image.setAttribute("alt", `Logo of ${company.name}`);
    image.setAttribute("loading", "lazy");
    image.setAttribute("width", "auto");
    image.setAttribute("height", "100");

    card.appendChild(name);
    card.appendChild(image);
    card.appendChild(address);
    card.appendChild(phone);
    card.appendChild(website);
    card.appendChild(membershipLevel);

    membersContainer.appendChild(card);
  });
};