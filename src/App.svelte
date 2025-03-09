
    
   <script>
  // ✅ 1. External Libraries First
  import Router from "svelte-spa-router";
  import routes from "../routes.js";
  import { writable } from "svelte/store";
  import { favorites } from "./store.js";
  
  let favsCount = 0;
  
  // Update favorites count when favorites change
  favorites.subscribe(favs => {
    favsCount = favs.length;
  });
</script>

<!-- Banner with Navigation -->
<div class="glide-banner">
  <div class="logo">glide</div>
  <nav class="main-nav">
    <a href="#/" class="nav-link">Home</a>
    <a href="#/favorites" class="nav-link">
      Favorites 
      {#if favsCount > 0}
        <span class="fav-count">{favsCount}</span>
      {/if}
    </a>
    <a href="#/compare" class="nav-link">Compare</a>
  </nav>
</div>

<!-- Router -->
<main>
  <Router {routes} />
</main>

<style>
  /* Green Banner Styling */
  .glide-banner {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 50px;
    background: #EDE6DD;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  /* Smooth Hover Effect */
  .glide-banner:hover {
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
  }
  
  .logo {
    font-size: 24px;
    font-weight: bold;
    color: black;
    font-family: 'Editorial New', serif;
  }
  
  .main-nav {
    display: flex;
    gap: 20px;
  }
  
  .nav-link {
    color: #333;
    text-decoration: none;
    font-weight: 500;
    padding: 5px 10px;
    border-radius: 4px;
    transition: background-color 0.2s;
    position: relative;
  }
  
  .nav-link:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
  
  .fav-count {
    position: absolute;
    top: -5px;
    right: -8px;
    background-color: #ff385c;
    color: white;
    font-size: 12px;
    border-radius: 50%;
    width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>