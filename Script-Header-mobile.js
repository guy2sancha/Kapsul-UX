
const burger=document.getElementById("burgerMenu");
const drawer=document.getElementById("mobileDrawer");
const closeBtn=drawer.querySelector(".close-btn");

burger.onclick=()=>drawer.classList.add("open");
closeBtn.onclick=()=>drawer.classList.remove("open");

// accordions
document.querySelectorAll(".accordion-btn").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    const acc=btn.parentElement;
    acc.classList.toggle("open");
  });
});
