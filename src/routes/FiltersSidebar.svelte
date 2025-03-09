
<script>
  import { listings, allListings, userPreferences } from '../store.js';
  import { onMount } from 'svelte';
  
  // Filter state
  let priceRange = { min: 0, max: 10000 };
  let bedsRange = { min: 0, max: 5 };
  let bathsRange = { min: 0, max: 5 };
  let sqftRange = { min: 0, max: 3500 };
  let searchQuery = '';
  let amenityFilters = [
    { name: 'Grocery store', value: 'grocery', checked: false },
    { name: 'Gym', value: 'gym', checked: false },
    { name: 'Restaurant', value: 'restaurant', checked: false },
    { name: 'Park', value: 'park', checked: false },
    { name: 'School', value: 'school', checked: false }
  ];
  
  // POI types - Points of Interest
  let poiTypes = [];
  
  // Initialize min/max values from listings data
  onMount(() => {
    const allListingsData = $allListings;
    if (allListingsData.length) {
      // Set price range
      const prices = allListingsData.map(l => l.price);
      priceRange.min = Math.min(...prices);
      priceRange.max = Math.max(...prices);
      
      // Set beds range
      const beds = allListingsData.map(l => l.beds);
      bedsRange.min = Math.min(...beds);
      bedsRange.max = Math.max(...beds);
      
      // Set baths range
      const baths = allListingsData.map(l => l.baths);
      bathsRange.min = Math.min(...baths);
      bathsRange.max = Math.max(...baths);
      
      // Set sqft range
      const sqfts = allListingsData.map(l => l.sqft);
      sqftRange.min = Math.min(...sqfts);
      sqftRange.max = Math.max(...sqfts);
    }
  });
  
  // Filter listings based on current criteria
  function applyFilters() {
    const filtered = $allListings.filter(listing => {
      // Check price range
      if (listing.price < priceRange.min || listing.price > priceRange.max) {
        return false;
      }
      
      // Check beds range
      if (listing.beds < bedsRange.min || listing.beds > bedsRange.max) {
        return false;
      }
      
      // Check baths range
      if (listing.baths < bathsRange.min || listing.baths > bathsRange.max) {
        return false;
      }
      
      // Check sqft range
      if (listing.sqft < sqftRange.min || listing.sqft > sqftRange.max) {
        return false;
      }
      
      // Check address search
      if (searchQuery && !listing.address.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      return true;
    });
    
    listings.set(filtered);
  }
  
  // Reset all filters
  function resetFilters() {
    searchQuery = '';
    
    // Reset to original ranges from data
    const allListingsData = $allListings;
    if (allListingsData.length) {
      const prices = allListingsData.map(l => l.price);
      priceRange.min = Math.min(...prices);
      priceRange.max = Math.max(...prices);
      
      const beds = allListingsData.map(l => l.beds);
      bedsRange.min = Math.min(...beds);
      bedsRange.max = Math.max(...beds);
      
      const baths = allListingsData.map(l => l.baths);
      bathsRange.min = Math.min(...baths);
      bathsRange.max = Math.max(...baths);
      
      const sqfts = allListingsData.map(l => l.sqft);
      sqftRange.min = Math.min(...sqfts);
      sqftRange.max = Math.max(...sqfts);
    }
    
    amenityFilters.forEach(filter => filter.checked = false);
    poiTypes = [];
    
    // Reset listings to show all
    listings.set($allListings);
  }
  
  // Update POI preferences
  function updatePoiPreferences() {
    // Get selected POI types
    const selectedPOIs = amenityFilters
      .filter(filter => filter.checked)
      .map(filter => filter.value);
    
    poiTypes = selectedPOIs;
    
    // Update user preferences
    const currentPrefs = $userPreferences;
    userPreferences.set({
      ...currentPrefs,
      poiTypes: selectedPOIs,
      grocery: selectedPOIs.includes('grocery') ? 'supermarket' : '',
      gym: selectedPOIs.includes('gym') ? 'fitness' : ''
    });
  }
  
  // Apply both basic filters and POI preferences
  function applyAllFilters() {
    applyFilters();
    updatePoiPreferences();
  }
  
  $: currentCount = $listings.length;
  $: totalCount = $allListings.length;
</script>

<div class="filters-sidebar">
  <div class="filters-header">
    <h2>Filters</h2>
    <button class="reset-btn" on:click={resetFilters}>Reset</button>
  </div>
  
  <div class="filter-section">
    <h3>Search</h3>
    <input 
      type="text" 
      placeholder="Search by address" 
      bind:value={searchQuery}
      class="search-input"
    />
  </div>
  
  <div class="filter-section">
    <h3>Price Range</h3>
    <div class="range-inputs">
      <input 
        type="number" 
        bind:value={priceRange.min} 
        min="0" 
        step="100"
      />
      <span>to</span>
      <input 
        type="number" 
        bind:value={priceRange.max} 
        min="0" 
        step="100"
      />
    </div>
    <div class="slider-container">
      <input 
        type="range" 
        bind:value={priceRange.min} 
        min={0} 
        max={priceRange.max} 
        step="100"
        class="range-slider min-slider"
      />
      <input 
        type="range" 
        bind:value={priceRange.max} 
        min={priceRange.min} 
        max={15000} 
        step="100"
        class="range-slider max-slider"
      />
    </div>
  </div>
  
  <div class="filter-section">
    <h3>Bedrooms</h3>
    <div class="range-inputs">
      <input 
        type="number" 
        bind:value={bedsRange.min} 
        min="0" 
        max="5"
        step="1"
      />
      <span>to</span>
      <input 
        type="number" 
        bind:value={bedsRange.max} 
        min={bedsRange.min} 
        max="5"
        step="1"
      />
    </div>
  </div>
  
  <div class="filter-section">
    <h3>Bathrooms</h3>
    <div class="range-inputs">
      <input 
        type="number" 
        bind:value={bathsRange.min} 
        min="0" 
        max="5"
        step="0.5"
      />
      <span>to</span>
      <input 
        type="number" 
        bind:value={bathsRange.max} 
        min={bathsRange.min} 
        max="5"
        step="0.5"
      />
    </div>
  </div>
  
  <div class="filter-section">
    <h3>Square Footage</h3>
    <div class="range-inputs">
      <input 
        type="number" 
        bind:value={sqftRange.min} 
        min="0" 
        step="50"
      />
      <span>to</span>
      <input 
        type="number" 
        bind:value={sqftRange.max} 
        min={sqftRange.min} 
        step="50"
      />
    </div>
    <div class="slider-container">
      <input 
        type="range" 
        bind:value={sqftRange.min} 
        min={0} 
        max={sqftRange.max} 
        step="50"
        class="range-slider min-slider"
      />
      <input 
        type="range" 
        bind:value={sqftRange.max} 
        min={sqftRange.min} 
        max={5000} 
        step="50"
        class="range-slider max-slider"
      />
    </div>
  </div>
  
  <div class="filter-section">
    <h3>Nearby Amenities</h3>
    <div class="checkbox-list">
      {#each amenityFilters as filter}
        <label class="checkbox-item">
          <input 
            type="checkbox" 
            bind:checked={filter.checked}
          />
          <span>{filter.name}</span>
        </label>
      {/each}
    </div>
  </div>
  
  <div class="apply-section">
    <button class="apply-btn" on:click={applyAllFilters}>
      Apply Filters
    </button>
    <span class="results-count">
      Showing {currentCount} of {totalCount} listings
    </span>
  </div>
</div>

<style>
  .filters-sidebar {
    background-color: #fff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    max-width: 300px;
  }
  
  .filters-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    border-bottom: 1px solid #eee;
    padding-bottom: 10px;
  }
  
  .filters-header h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
  }
  
  .reset-btn {
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    text-decoration: underline;
    font-size: 0.9rem;
  }
  
  .filter-section {
    margin-bottom: 20px;
  }
  
  .filter-section h3 {
    font-size: 1rem;
    margin-bottom: 10px;
    font-weight: 500;
  }
  
  .search-input {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.9rem;
  }
  
  .range-inputs {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
  }
  
  .range-inputs input {
    width: 90px;
    padding: 6px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.9rem;
  }
  
  .range-inputs span {
    color: #666;
  }
  
  .slider-container {
    position: relative;
    height: 30px;
    margin-top: 10px;
  }
  
  .range-slider {
    position: absolute;
    width: 100%;
    margin: 0;
    background: transparent;
    pointer-events: none;
  }
  
  .range-slider::-webkit-slider-thumb {
    pointer-events: auto;
  }
  
  .min-slider {
    z-index: 2;
  }
  
  .max-slider {
    z-index: 1;
  }
  
  .checkbox-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .checkbox-item {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }
  
  .apply-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 30px;
  }
  
  .apply-btn {
    background-color: #3498db;
    color: white;
    border: none;
    padding: 10px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s;
  }
  
  .apply-btn:hover {
    background-color: #2980b9;
  }
  
  .results-count {
    text-align: center;
    font-size: 0.8rem;
    color: #666;
  }
</style>
