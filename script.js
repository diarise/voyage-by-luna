function toggleMobileMenu() {
    const mobileNav = document.querySelector("nav ul");
    mobileNav.classList.toggle("open");
}

document.getElementById('scroll-top-button').addEventListener('click', function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});





