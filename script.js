
"use strict";

const STORAGE_KEY = "girlsSafetyTrustedContacts";

let contacts = loadContacts();
let currentLocationLink = "";

const statusElement = document.getElementById("status");
const locationText = document.getElementById("locationText");
const mapLink = document.getElementById("mapLink");
const contactList = document.getElementById("contactList");
const contactCount = document.getElementById("contactCount");
const contactMessage = document.getElementById("contactMessage");

function setStatus(message) {
  statusElement.textContent = message;
}

function loadContacts() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveContacts() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
    return true;
  } catch (error) {
    alert("Contacts could not be saved. Check your browser settings.");
    return false;
  }
}

function renderContacts() {
  contactList.replaceChildren();

  contactCount.textContent =
    contacts.length + (contacts.length === 1 ? " contact" : " contacts");

  if (contacts.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-message";
    empty.textContent = "No contacts added yet. Add someone you trust.";
    contactList.appendChild(empty);
    return;
  }

  contacts.forEach(function (contact, index) {
    const item = document.createElement("div");
    item.className = "contact-item";

    const avatar = document.createElement("div");
    avatar.className = "contact-avatar";
    avatar.innerHTML = '<i class="bi bi-person-fill"></i>';

    const info = document.createElement("div");
    info.className = "contact-info";

    const name = document.createElement("strong");
    name.textContent = contact.name;

    const phone = document.createElement("small");
    phone.textContent = contact.phone;

    info.append(name, phone);

    const actions = document.createElement("div");
    actions.className = "contact-actions";

    const call = document.createElement("a");
    call.className = "btn btn-success";
    call.href = "tel:" + contact.phone.replace(/[^\d+]/g, "");
    call.textContent = "Call";

    const sms = document.createElement("button");
    sms.className = "btn btn-primary";
    sms.type = "button";
    sms.textContent = "SMS";
    sms.addEventListener("click", function () {
      prepareSMS(index);
    });

    const remove = document.createElement("button");
    remove.className = "btn btn-danger";
    remove.type = "button";
    remove.textContent = "Delete";
    remove.addEventListener("click", function () {
      deleteContact(index);
    });

    actions.append(call, sms, remove);
    item.append(avatar, info, actions);
    contactList.appendChild(item);
  });
}

document.getElementById("contactForm").addEventListener("submit", function (event) {
  event.preventDefault();

  const nameInput = document.getElementById("contactName");
  const phoneInput = document.getElementById("contactPhone");

  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  const digits = phone.replace(/\D/g, "");

  if (!name) {
    contactMessage.textContent = "Please enter a contact name.";
    return;
  }

  if (digits.length < 10 || digits.length > 15) {
    contactMessage.textContent = "Enter a valid phone number with 10–15 digits.";
    return;
  }

  const duplicate = contacts.some(function (contact) {
    return contact.phone.replace(/\D/g, "") === digits;
  });

  if (duplicate) {
    contactMessage.textContent = "This number is already saved.";
    return;
  }

  contacts.push({
    name: name,
    phone: phone
  });

  if (!saveContacts()) {
    contacts.pop();
    return;
  }

  renderContacts();
  this.reset();

  contactMessage.textContent = "Trusted contact saved successfully.";
});

function deleteContact(index) {
  if (!contacts[index]) return;

  const confirmed = confirm(
    "Delete " + contacts[index].name + " from your trusted contacts?"
  );

  if (!confirmed) return;

  const removed = contacts.splice(index, 1)[0];

  if (!saveContacts()) {
    contacts.splice(index, 0, removed);
    return;
  }

  renderContacts();
  contactMessage.textContent = "Contact deleted.";
}

function prepareSMS(index) {
  if (contacts.length === 0) {
    alert("Please add a trusted contact first.");
    document.getElementById("contacts").scrollIntoView({ behavior: "smooth" });
    return;
  }

  let selectedIndex = index;

  if (typeof selectedIndex !== "number") {
    if (contacts.length === 1) {
      selectedIndex = 0;
    } else {
      const options = contacts.map(function (contact, i) {
        return (i + 1) + ". " + contact.name + " — " + contact.phone;
      }).join("\n");

      const answer = prompt(
        "Choose a trusted contact by number:\n\n" + options
      );

      if (answer === null) return;

      selectedIndex = Number(answer) - 1;
    }
  }

  const contact = contacts[selectedIndex];

  if (!contact) {
    alert("Invalid contact selection.");
    return;
  }

  let message = "I may need help. Please contact me as soon as possible.";

  if (currentLocationLink) {
    message += "\nMy location: " + currentLocationLink;
  }

  const phone = contact.phone.replace(/[^\d+]/g, "");
  const smsUrl = "sms:" + phone + "?body=" + encodeURIComponent(message);

  window.location.href = smsUrl;
}

function getLocation() {
  locationText.textContent = "Requesting location permission...";
  mapLink.hidden = true;

  if (!navigator.geolocation) {
    locationText.textContent = "Location is not supported by this browser.";
    return;
  }

  navigator.geolocation.getCurrentPosition(
    function (position) {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      currentLocationLink =
        "https://www.google.com/maps?q=" + latitude + "," + longitude;

      locationText.textContent =
        "Latitude: " + latitude.toFixed(5) +
        " | Longitude: " + longitude.toFixed(5);

      mapLink.href = currentLocationLink;
      mapLink.hidden = false;

      setStatus("Your location was found.");
    },
    function (error) {
      if (error.code === 1) {
        locationText.textContent =
          "Location permission denied. Allow location access and try again.";
      } else if (error.code === 2) {
        locationText.textContent =
          "Location unavailable. Check your device's location settings.";
      } else if (error.code === 3) {
        locationText.textContent =
          "Location request timed out. Please try again.";
      } else {
        locationText.textContent = "Unable to get location. Please try again.";
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    }
  );
}

document.getElementById("locationButton").addEventListener("click", getLocation);

document.getElementById("sosButton").addEventListener("click", function () {
  setStatus("Emergency help selected. Choose a help option below.");

  const emergencySection = document.getElementById("safety");
  emergencySection.scrollIntoView({ behavior: "smooth" });

  const choice = confirm(
    "Do you need emergency help?\n\nPress OK to open the emergency dialer for 112.\nPress Cancel to prepare an SMS for a trusted contact."
  );

  if (choice) {
    window.location.href = "tel:112";
  } else {
    prepareSMS();
  }
});

document.getElementById("safeButton").addEventListener("click", function () {
  setStatus("You marked yourself as safe. 💗");
});

document.getElementById("themeToggle").addEventListener("click", function () {
  document.body.classList.toggle("dark-mode");

  const darkMode = document.body.classList.contains("dark-mode");
  const icon = this.querySelector("i");

  icon.className = darkMode
    ? "bi bi-sun-fill"
    : "bi bi-moon-stars-fill";

  try {
    localStorage.setItem("girlsSafetyDarkMode", darkMode ? "on" : "off");
  } catch (error) {
    // Theme still works for this page session.
  }
});

try {
  if (localStorage.getItem("girlsSafetyDarkMode") === "on") {
    document.body.classList.add("dark-mode");
    document.querySelector("#themeToggle i").className = "bi bi-sun-fill";
  }
} catch (error) {
  // Continue with the default light theme.
}

renderContacts();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker
      .register("./service-worker.js")
      .then(function () {
        console.log("Offline support registered.");
      })
      .catch(function (error) {
        console.error("Service worker registration failed:", error);
      });
  });
}
