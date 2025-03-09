
    
   <script>

    // ✅ 1. External Libraries First
  import Router from "svelte-spa-router";
  import routes from "../routes.js";
  import { writable } from "svelte/store";






</script>


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
}

/* Smooth Hover Effect */
.glide-banner:hover {
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
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


</style>
<div class="glide-banner">
   <div class="logo">glide</div>
</div>