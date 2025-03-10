<script>

    // ✅ 1. External Libraries First
  import { onMount, tick } from 'svelte';
  import { writable, get } from 'svelte/store'; 


  // ✅ 2. Store Imports Next (No Duplicates)
  import { 
  listings, 
  allListings,
  favorites, 
  selectedAttributes, 
  userPreferences, 
  toggleFavorite, 
  getCompareData, 
  updateUserPreferences,
  findNearestPlace
} from '../store.js';

 const currentRoute = writable(window.location.hash.replace("#", "") || "/");

  // Listen for hash changes
  window.addEventListener("hashchange", () => {
    currentRoute.set(window.location.hash.replace("#", "") || "/");
  });


let filters = writable({
    min_price: "",
    max_price: "",
    min_beds: "",
    max_beds: "",
    min_baths: "",
    max_baths: "",
    min_sqft: "",
    max_sqft: ""
});

  let map;
  let markers = [];
  let listingMarkers = new Map();
  let compareListings = writable([]);
  let selectedAttributesLocal = writable({
    price: true,
    sqft: true,
    beds: true,
    baths: true
  });

  let openInfoWindows = []
  let routeInfoWindows = []; 

  let directionsService;
  let directionsRenderers = [];
  let cachedRoutes = new Map(); // ✅ Stores already-fetched routes

  let groceryStore = '';
  let gym = '';
  let showComparePage = writable(false);
  let showMap = writable(false); // ✅ Moved inside <script>

  let showMapView = writable(false);


  let filterSidebarOpen = false;

function toggleFilterSidebar() {
    filterSidebarOpen = !filterSidebarOpen;
}
function toggleViewMode() {
    showMapView.update(value => {
        const newValue = !value;

        // Only initialize map when switching to map view
        if (newValue) {
            setTimeout(() => {
                const mapContainer = document.getElementById('map-listings');
                if (mapContainer) {
                    console.log("✅ Listings Map found, initializing...");
                    initializeMap($listings,false);
                } else {
                    console.warn("🚨 Listings Map container still missing!");
                }
            }, 500);
        }

        return newValue;
    });
}






  // **Predefined Colors for Unique Listings**
  const colors = [
    "red", "blue", "green", "purple", "orange", "pink", "yellow", "cyan"
  ];

  function getRandomColor(index) {
    return colors[index % colors.length];
  }

   // **Load Google Maps API dynamically**
  function loadGoogleMapsScript(callback) {
    if (window.google && window.google.maps) {
      callback();
      return;
    }
    fetch('../api/maps-key')
        .then(response => response.json())
        .then(({ key }) => {
            if (!key) throw new Error("Missing API key from backend.");
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = callback;
    document.head.appendChild(script);
  })
  }




  const updatePreferences = async () => {
    console.log("🔄 Updating user preferences...");

    const prefs = get(userPreferences);
    await updateUserPreferences({ 
        grocery: groceryStore, 
        gym: gym, 
        poiTypes: prefs.poiTypes // ✅ Include POIs in update
    });

    await tick(); // ✅ Wait for Svelte reactivity updates
    compareListings.set(getCompareData());

    initializeMap(get(listings), false); // ✅ Ensure POIs refresh in normal view
};


  async function initializeMap(listingsData, isComparePage = false) {
    await tick();
     let mapContainer = document.getElementById('map-listings');
     listingsData.forEach(listing => {
        console.log(`🔍 Checking listing: ${listing.address}`);
        console.log(`   🛒 Nearest Grocery:`, listing.nearestGrocery);
        console.log(`   🏋️ Nearest Gym:`, listing.nearestGym);
    });

  console.log(getComputedStyle(mapContainer));


    if (!mapContainer) {
        console.warn("🚨 #map container missing! Retrying in 500ms...");
        setTimeout(() => initializeMap(listingsData, false), 500);
        return;
    }
    console.log(mapContainer);
    console.log("✅ #map container FOUND, initializing map...");
     // 🔥 DESTROY EXISTING MAP IF SWITCHING PAGES
    if (map) {
        console.warn("🔄 Removing existing Google Map instance...");
        map = null;  // Force reinitialization
    }
    if (!map) {
         map = new google.maps.Map(mapContainer, {
        center: { lat: 40.7128, lng: -74.0060 }, // Default to NYC
        zoom: 12,
      });
      // ✅ Close all InfoWindows when clicking on the map (but not markers)
        map.addListener("click", () => {
            closeAllInfoWindows();
            closeAllRouteInfoWindows();
        });

    }
    else {
    console.log("🔄 Resizing map...");
    google.maps.event.trigger(map, "resize"); // ✅ Fix hidden map bug
}
    console.log("🟢 Listings to add markers for:", listingsData);
    markers.forEach(marker => marker.setMap(null));
    markers = [];
    listingMarkers.clear();


    listingsData.forEach((listing,index) => {
        if (listing.lat && listing.lon) {
            const color = "blue"; 
            console.log(`📌 Adding marker for ${listing.address}`);
             const listingMarker = new google.maps.Marker({
                    position: { lat: listing.lat, lng: listing.lon },
                    map,
                    title: listing.address,
                    icon: `http://maps.google.com/mapfiles/ms/icons/${color}-dot.png`,
                  });

              const infoWindow = new google.maps.InfoWindow({
                    content: `<strong>${listing.address}</strong>`,
                  });

              listingMarker.addListener("click", () => {
                    closeAllInfoWindows();
                    closeAllRouteInfoWindows();
                    infoWindow.open(map, listingMarker);
                    openInfoWindows.push(infoWindow); //Tracked opened window
                  });

              markers.push(listingMarker);
              listingMarkers.set(listing.address, { listingMarker, color });

                addPOIMarkers(listing);
                console.log(`📌 Adding marker for POI's`);

        }
              });
  }


function addPOIMarkers(listing) {
    if (!listing.nearestPOIs) return;

    // 🔹 Define colors for different POI types
    const poiIcons = {
        Cafes: "https://e7.pngegg.com/pngimages/730/808/png-clipart-cafe-computer-icons-coffee-cup-scalable-graphics-tea-cafe-tea.png",
        "Public Transport": "https://banner2.cleanpng.com/20180629/ygp/aayomidyz.webp",
        Schools: "https://e7.pngegg.com/pngimages/711/889/png-clipart-school-illustration-national-secondary-school-computer-icons-middle-school-high-school-icon-angle-logo-thumbnail.png",
        Restaurants: "https://e7.pngegg.com/pngimages/554/203/png-clipart-restaurant-computer-icons-food-menu-menu-text-eating.png"
    };
    // 🔥 Loop through all selected POIs and add markers
    Object.keys(listing.nearestPOIs).forEach(poiType => {
        const poi = listing.nearestPOIs[poiType];
        if (!poi || !poi.lat || !poi.lon) return; // Skip if missing coordinates

        const poiMarker = new google.maps.Marker({
            position: { lat: poi.lat, lng: poi.lon },
            map,
            title: `${poiType}: ${poi.name}`,
            icon: {
                url: poiIcons[poiType] || "https://img.icons8.com/ios-filled/48/marker.png", // Default icon
                scaledSize: new google.maps.Size(20, 20)
            }
        });

        markers.push(poiMarker);

        // 🔹 Add info window to show POI details
        const infoWindow = new google.maps.InfoWindow({
            content: `<strong>${poiType}: ${poi.name}</strong><br>📍 Distance: ${poi.distance}`
        });

        poiMarker.addListener("click", () => {
            infoWindow.open(map, poiMarker);
        });

        console.log(`📍 Added POI marker: ${poiType} (${poi.name})`);
    });
}



// ✅ Close all currently open InfoWindows
function closeAllInfoWindows() {
    openInfoWindows.forEach(infoWindow => infoWindow.close());
    openInfoWindows = []; // ✅ Reset open InfoWindows
}

 //✅ Close all InfoWindows that show travel time on routes
function closeAllRouteInfoWindows() {
    routeInfoWindows.forEach(infoWindow => infoWindow.close());
    routeInfoWindows = []; // ✅ Reset route InfoWindows
}








const handleCompare = async () => {
    await tick();
    const data = getCompareData();
    console.log("🔍 Compare Data:", data);
    compareListings.set(data);

    if (data.length > 0) {
        showComparePage.set(true);
        showMap.set(true);

        // ✅ Update the URL hash to trigger route change
        window.location.hash = "#/compare";

        await tick(); 
        console.log("🔍 Final Compare Data:", $compareListings);
    }
};


function handleScroll() {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
    fetchListings({}, true); // Load more listings when near bottom
  }
}

async function togglePOI(poi) {
    userPreferences.update(prefs => {
        const poiTypes = new Set(prefs.poiTypes || []); // Ensure it's a Set
        if (poiTypes.has(poi)) {
            poiTypes.delete(poi); // Remove if already selected
        } else {
            poiTypes.add(poi); // Add if not selected
        }
        return { ...prefs, poiTypes: Array.from(poiTypes) };
    });

    await tick(); // ✅ Wait for Svelte to update userPreferences
    console.log("📍 Updated POIs:", get(userPreferences).poiTypes);
    updatePreferences(); // ✅ Now ensures correct POIs are used
}


async function applyFilters() {
    const filterValues = get(filters); // Get the latest filter values
    const allData = get(allListings); // Get the full dataset
    const selectedPOIs = get(userPreferences).poiTypes || []; // Get selected POIs
    console.log(`✅ POI Listings: ${selectedPOIs} results.`);

    const filteredListings = allData.filter(listing => {
        return (
            (!filterValues.min_price || listing.price >= filterValues.min_price) &&
            (!filterValues.max_price || listing.price <= filterValues.max_price) &&
            (!filterValues.min_beds || listing.beds >= filterValues.min_beds) &&
            (!filterValues.max_beds || listing.beds <= filterValues.max_beds) &&
            (!filterValues.min_baths || listing.baths >= filterValues.min_baths) &&
            (!filterValues.max_baths || listing.baths <= filterValues.max_baths) &&
            (!filterValues.min_sqft || listing.sqft >= filterValues.min_sqft) &&
            (!filterValues.max_sqft || listing.sqft <= filterValues.max_sqft)
        );
    });

    console.log(`✅ Filtered Listings: ${filteredListings.length} results.`);
    // 🔹 Step 2: Fetch POI Data Only If Needed
    if (selectedPOIs.length > 0) {
        console.log(`🔍 Fetching POIs for: ${selectedPOIs}`);

        for (let listing of filteredListings) {
            listing.nearestPOIs = {};
             // 🔥 Use `await Promise.all()` for better performance
            await Promise.all(selectedPOIs.map(async (poiType) => {
                listing.nearestPOIs[poiType] = await findNearestPlace(listing, poiType, poiType);
            }));
        }
    }

    listings.set(filteredListings); // Update the filtered results


    // 🔥 Reload the Map after filtering
    setTimeout(() => {
        initializeMap(filteredListings, false); // Reinitialize with filtered data
    }, 200);
}





  onMount(() => {
    window.addEventListener("scroll", handleScroll);
  loadGoogleMapsScript(() =>{
    listings.subscribe(l => {
      if (l.length > 0) {
        console.log("✅ Listings loaded, checking if map should initialize...");
      } else {
        console.warn("⚠️ Listings not yet loaded.");
      }
    });
  });
  });

</script>



<style>
  @import 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';

  #container {
    display: flex;
    height: 100vh;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  #map-container {
    width: 100%;
    height: 500px;
  }

  .listing-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
  }
  .listing {
    background: white;
    padding: 15px;
    margin: 10px;
    border-radius: 8px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    width: 30%;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .listings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); /* 2 wide */
    gap: 2rem; /* Space between tiles */
    width: 100%;
    max-width: 90%; /* Keeps layout clean */
    margin: auto;
    padding: 1rem;
}
.quick-apply-button {
   background-color: #007bff;
    color: white;
    border: none;
    padding: 8px;
    font-size: 12px;
    font-weight: bold;
    border-radius: 5px;
    cursor: pointer;
    width: 100%;
    margin-top: 5px;
    transition: background-color 0.2s;
}

.quick-apply-button:hover {
  background-color: #0056b3; /* Darker blue on hover */
}

/* Ensure proper alignment */
.listing-card {
   display: flex;
    flex-direction: column;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    padding: 10px;
    text-align: left;
    position: relative;
    transition: transform 0.2s;
    width: 100%; /* Adjust to grid */
    max-width: 400px; /* Prevents them from being too large */
    margin-bottom: 1rem; /* Added margin for spacing */
}

.listing-card:hover {
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.15); /* Slightly stronger shadow instead of scaling */
}

.listing-image {
    width: 100%;
    height: 140px; /* Adjust height to be smaller */
    border-radius: 8px;
    overflow: hidden;
    position: relative;
}

.listing-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.favorite-button {
    position: absolute;
    top: 10px;
    right: 10px;
    background: rgba(255, 255, 255, 0.8);
    border: none;
    font-size: 1.3rem;
    cursor: pointer;
    padding: 5px;
    border-radius: 50%;
    z-index: 10; /* Ensures it's always above other elements */
    transition: background 0.2s;
}

.favorite-button:hover {
    background: rgba(255, 255, 255, 1);
}
.listing-info {
  padding: 10px 0;
}

.listing-price {
  font-size: 1.2em;
  font-weight: bold;
  margin: 0;
}

.listing-details {
  font-size: 0.8em;
  color: gray;
}

.listing-address {
  font-size: 0.8em;
  font-weight: bold;
  margin-top: 5px;
}



  #map {
    width: 100%;
    height: 100%;
    display:block;
  }
  #map-listings {
    width: 100%;
    height: 100%;
  }


  .listing-details {
    width: 100%;
    max-width: 1200px;
    margin: 20px auto;
    background: #ffffff;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    padding: 15px;
  }
  .compare-container {
  position: fixed;
  top: 100px;
  right: 20px;
  z-index: 1003; /* Ensure it stays above everything */
}
  .compare-button {
  padding: 12px 20px;
  background-color: #007bff;
  color: white;
  font-size: 1em;
  border: none;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.2s;
  box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.2);
}

.compare-button:hover {
  background-color: #0056b3;
}
  table {
    width: 100%;
    border-collapse: collapse;
  }

  th, td {
    padding: 10px;
    border: 1px solid #ddd;
    text-align: left;
  }

  th {
    background-color: #f4f4f4;
  }




 .filter-sidebar {
    position: fixed;
    right: 0;
    top: 0;
    width: 300px;
    height: 100vh;
    background: white;
    padding: 20px;
    box-shadow: -2px 0 10px rgba(0, 0, 0, 0.2);
    transform: translateX(100%); /* Start hidden */
    transition: transform 0.3s ease-in-out;
    z-index: 1000;
    overflow-y: auto; /* Allows scrolling if content overflows */
    display: flex;
    flex-direction: column;
    gap: 15px; /* Space between inputs */
}
.filter-sidebar.open {
  transform: translateX(0);
}

.filter-toggle {
   position: fixed;
    top: 50%;
    right: 0;
    transform: translateY(-50%);
    padding: 10px;
    background-color: blue;
    color: white;
    border: none;
    cursor: pointer;
    border-radius: 8px 0 0 8px;
    z-index: 1101;
}

/* Filter Labels & Inputs */
.filter-group {
    display: flex;
    flex-direction: column;
    gap: 5px; /* Small spacing between label and input */
}

.filter-group label {
    font-size: 14px;
    font-weight: bold;
    color: #333; /* Dark gray for readability */
}

.filter-group input {
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 5px;
    font-size: 14px;
}
.apply-filters {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px;
  margin-top: 10px;
  cursor: pointer;
  width: 100%;
  border-radius: 5px;
}
.apply-filters:hover {
    background: #0056b3;
}
/* Green Banner Styling */
.glide-banner {
      position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 50px;
    background: #EDE6DD;
    z-index: 1000;
}

/* Smooth Hover Effect */
.glide-banner:hover {
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
}



.content-container {
    padding-top: 10px; /* Pushes content below the banner */
    background-color: #FBF7F0;
}


/* Default: Listings take full width */
.view-layout {
    display: flex;
    flex-direction: column;
}
/* Split View: Listings on the left, Map on the right */
.view-layout.split-view {
    flex-direction: row;
    gap: 15px;
     display: flex;
    height: 100vh; /* Full viewport height */
    overflow: hidden; /* Prevents body scrolling */
}

/* When in split view, make listings smaller */
.view-layout.split-view .listings-grid {
    flex: 1;
    max-width: 50%;
    height: calc(100vh - 100px); /* Adjust based on header size */
    overflow-y: auto; /* Enables vertical scrolling */
    padding: 15px;
}
#map-container-listings {
    flex: 1;
    max-width: 50%;
    height: 100vh;
}
.logo {
    position: absolute;
    top: 10px;
    left: 20px;
    font-size: 24px;
    font-weight: bold;
    color: black;
    font-family: 'Editorial New', serif;
}
.toggle-switch {
    position: relative;
    top: auto;
    left: 50%;
    transform: translateX(-50%);
    background: white;
    color: black;
    padding: 6px;
    border-radius: 30px;
    display: flex;
    width: 180px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    z-index: 1200;
}

.toggle-option {
    flex: 1;
    text-align: center;
    padding: 10px;
    border-radius: 30px;
    cursor: pointer;
    transition: background 0.3s, color 0.3s;
    font-weight: 600;
}

.toggle-option.selected {
    background: #0d4727;
    color: white;
}

.floating-chat {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    width: 60px;
    height: 60px;
    background: white;
    border-radius: 50%;
    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    z-index: 1300;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 1px solid #ccc;
    cursor: pointer;
    transition: width 0.3s ease, height 0.3s ease, border-radius 0.3s ease;
    overflow: hidden;
}

.floating-chat:hover {
    width: 300px;
    height: 60px;
    border-radius: 30px;
    justify-content: flex-start;
    padding-left: 15px;
}

.chat-icon {
    font-size: 24px;
    color: #333;
}

.chat-content {
    display: none;
}

.floating-chat:hover .chat-content {
    display: block;
    width: 100%;
}
body {
    overflow: hidden; /* Prevents full-page scrolling */
}
.nav-button {
    background-color: #007bff;
    color: white;
    border-radius: 5px;
    text-decoration: none;
    font-weight: bold;
    display: inline-block;
    margin-top: 60px;
  }

  .nav-button:hover {
    background-color: #0056b3;
  }
  .moving{
    background-color: #FBF7F0;
    padding: 5px 0; /* Reduce vertical padding */
    margin: 0 auto; /* Reduce any additional spacing */
  }

@media (max-width: 600px) {
    .listings-grid {
        grid-template-columns: repeat(1, 1fr); /* 1 column on small screens */
    }

    .listing-card {
        max-width: 100%; /* Adjust width for mobile */
    }
}


</style>


<div class="moving">
<a href="#/moving-services" class="nav-button">🚛 Moving Services</a>
</div>
  <div class="content-container">
  <!-- Page Title -->
  <!-- View Toggle -->
  <div class="toggle-switch">
    <div class="toggle-option selected" on:click={toggleViewMode}>
        {$showMapView ? "Map" : "Listings"}
    </div>
</div>
    {#if $listings.length > 0}
      <button class="filter-toggle" on:click={toggleFilterSidebar}>
        {filterSidebarOpen ? "❌ Close Filters" : "🔍 Show Filters"}
      </button>

      <div class="filter-sidebar {filterSidebarOpen ? 'open' : ''}">
        <h3>Filters</h3>

        <div class="filter-group">
          <label>Min Price:</label>
          <input type="number" bind:value={$filters.min_price} placeholder="Min Price" />
        </div>

        <div class="filter-group">
          <label>Max Price:</label>
          <input type="number" bind:value={$filters.max_price} placeholder="Max Price" />
        </div>

        <div class="filter-group">
          <label>Min Beds:</label>
          <input type="number" bind:value={$filters.min_beds} placeholder="Min Beds" />
        </div>

        <div class="filter-group">
          <label>Max Beds:</label>
          <input type="number" bind:value={$filters.max_beds} placeholder="Max Beds" />
        </div>

        <div class="filter-group">
          <label>Min Sq Ft:</label>
          <input type="number" bind:value={$filters.min_sqft} placeholder="Min Sq Ft" />
        </div>

        <div class="filter-group">
          <label>Max Sq Ft:</label>
          <input type="number" bind:value={$filters.max_sqft} placeholder="Max Sq Ft" />
        </div>
        <div class="filter-group">
        {#each ["Cafes", "Public Transport", "Schools", "Restaurants"] as poi}
              <label>
                  <input type="checkbox"
                        on:change={() => togglePOI(poi)}
                        checked={$userPreferences.poiTypes.includes(poi)} />
                  {poi}
              </label>
          {/each}
      </div>

        <button class="apply-filters" on:click={applyFilters}>Apply Filters</button>

      </div>
      <div class="view-layout { $showMapView ? 'split-view' : '' }">
        <div class="listings-grid">
            {#each $listings as listing (listing.address)}
              <div class="listing-card">
                <div class="listing-image">
                  <img src={listing.photo || "https://via.placeholder.com/300"} alt="Listing Image" />
                  <button class="favorite-button" on:click={() => toggleFavorite(listing)}>
                    {#if $favorites.some(fav => fav.address === listing.address)} ❤️ {:else} ♡ {/if}
                  </button>
                </div>
                <div class="listing-info">
                  <h3 class="listing-price">${listing.price.toLocaleString()}</h3>
                  <p class="listing-details">{listing.beds} Beds • {listing.baths} Baths • {listing.sqft} sqft</p>
                  <p class="listing-address">{listing.address}</p>
                </div>
                <button class="quick-apply-button" on:click={() => handleQuickApply(listing)}>
              Quick Apply
              </button>
              </div>
            {/each}
          </div>

        {#if $showMapView}
          <div id="map-container-listings">
              <div id="map-listings"></div>
          </div>
        {/if}
      </div>
      <div class="compare-container">
        {#if $favorites && $favorites.length >= 3}
          <button class="compare-button" on:click={handleCompare}>Compare</button>
        {/if}
      </div>
    {:else}
        <p>Listings Loading...</p>
    {/if}
  </div>
  <div class="floating-chat">
    <div class="chat-icon">💬</div>
    <div class="chat-content">
        <div class="chat-display">Chat messages will appear here...</div>
        <div class="chat-input-container">
            <input type="text" class="chat-input" placeholder="Type a message...">
        </div>
    </div>
</div>