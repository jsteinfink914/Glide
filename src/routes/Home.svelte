
<script>
  import { onMount } from 'svelte';
  import { listings, favorites, toggleFavorite } from '../store.js';
  import FiltersSidebar from './FiltersSidebar.svelte';
  
  let favoritedIds = [];
  
  // Update favorited IDs whenever favorites change
  $: {
    favoritedIds = $favorites.map(fav => fav.id);
  }
  
  function handleFavoriteToggle(listing) {
    toggleFavorite(listing);
  }
</script>

<div class="home-container">
  <div class="sidebar">
    <FiltersSidebar />
  </div>
  
  <div class="main-content">
    <h1>NYC Rental Listings</h1>
    
    <div class="listings-grid">
      {#each $listings as listing (listing.id)}
        <div class="listing-card">
          <div class="listing-img-container">
            <img 
              src={listing.photo || 'https://via.placeholder.com/300x200?text=No+Image'} 
              alt={listing.address}
              class="listing-img"
            />
            <button 
              class="favorite-btn" 
              on:click={() => handleFavoriteToggle(listing)}
              aria-label={favoritedIds.includes(listing.id) ? "Remove from favorites" : "Add to favorites"}
            >
              <svg 
                viewBox="0 0 24 24" 
                class={favoritedIds.includes(listing.id) ? "heart-icon favorited" : "heart-icon"}
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </button>
          </div>
          
          <div class="listing-info">
            <h3 class="listing-price">${listing.price.toLocaleString()}/month</h3>
            <p class="listing-details">
              {listing.beds} {listing.beds === 1 ? 'bed' : 'beds'} • 
              {listing.baths} {listing.baths === 1 ? 'bath' : 'baths'} • 
              {listing.sqft.toLocaleString()} sqft
            </p>
            <p class="listing-address">{listing.address}</p>
            
            {#if listing.nearestGrocery}
              <p class="nearby-amenity">
                <span class="amenity-icon">🛒</span>
                Nearest grocery: {listing.nearestGrocery.name} ({listing.nearestGrocery.distance})
              </p>
            {/if}
            
            {#if listing.nearestGym}
              <p class="nearby-amenity">
                <span class="amenity-icon">💪</span>
                Nearest gym: {listing.nearestGym.name} ({listing.nearestGym.distance})
              </p>
            {/if}
            
            {#if listing.nearestPOIs}
              {#each Object.entries(listing.nearestPOIs) as [poiType, poi]}
                <p class="nearby-amenity">
                  <span class="amenity-icon">📍</span>
                  Nearest {poiType}: {poi.name} ({poi.distance})
                </p>
              {/each}
            {/if}
          </div>
        </div>
      {:else}
        <div class="no-results">
          <h2>No listings match your filters</h2>
          <p>Try adjusting your filter criteria</p>
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .home-container {
    display: flex;
    gap: 24px;
    max-width: 1200px;
    margin: 0 auto;
    padding: 24px;
    padding-top: 70px; /* Account for the banner */
  }
  
  .sidebar {
    flex: 0 0 280px;
    position: sticky;
    top: 70px; /* Account for the banner */
    height: calc(100vh - 70px);
    overflow-y: auto;
  }
  
  .main-content {
    flex: 1;
  }
  
  h1 {
    margin-bottom: 24px;
    font-size: 1.8rem;
    font-weight: 600;
  }
  
  .listings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 24px;
  }
  
  .listing-card {
    background-color: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  
  .listing-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 12px rgba(0,0,0,0.15);
  }
  
  .listing-img-container {
    position: relative;
    height: 200px;
  }
  
  .listing-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .favorite-btn {
    position: absolute;
    top: 12px;
    right: 12px;
    background-color: rgba(255, 255, 255, 0.8);
    border: none;
    border-radius: 50%;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .favorite-btn:hover {
    background-color: white;
  }
  
  .heart-icon {
    width: 24px;
    height: 24px;
    fill: none;
    stroke: #ff385c;
    stroke-width: 2px;
    transition: fill 0.2s;
  }
  
  .heart-icon.favorited {
    fill: #ff385c;
  }
  
  .listing-info {
    padding: 16px;
  }
  
  .listing-price {
    font-size: 1.3rem;
    font-weight: 600;
    margin: 0 0 8px 0;
  }
  
  .listing-details {
    color: #555;
    margin: 0 0 8px 0;
  }
  
  .listing-address {
    color: #333;
    margin: 0 0 12px 0;
    font-weight: 500;
  }
  
  .nearby-amenity {
    font-size: 0.9rem;
    color: #666;
    margin: 4px 0;
    display: flex;
    align-items: center;
  }
  
  .amenity-icon {
    margin-right: 6px;
  }
  
  .no-results {
    grid-column: 1 / -1;
    text-align: center;
    padding: 40px;
    background-color: #f9f9f9;
    border-radius: 8px;
  }
  
  .no-results h2 {
    color: #555;
    margin-bottom: 8px;
  }
  
  .no-results p {
    color: #888;
  }
</style>
