"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
const navigation=[{label:"Home",href:"/"},{label:"Books",href:"/books"},{label:"Categories",href:"/books"},{label:"Free Reads",href:"/free-reading"},{label:"About",href:"/about"}];
export function SiteHeader(){
 const pathname=usePathname(); const [open,setOpen]=useState(false); const [cartCount,setCartCount]=useState(0); const [search,setSearch]=useState("");
 useEffect(()=>{const refresh=()=>{try{const v=JSON.parse(localStorage.getItem("booknook_cart")||"[]");if(Array.isArray(v))setCartCount(v.length)}catch{setCartCount(0)}fetch("/api/cart",{cache:"no-store"}).then(async r=>{if(!r.ok)return;const d=await r.json();if(typeof d.count==="number")setCartCount(d.count)}).catch(()=>{})};refresh();window.addEventListener("booknook-cart-updated",refresh);window.addEventListener("storage",refresh);return()=>{window.removeEventListener("booknook-cart-updated",refresh);window.removeEventListener("storage",refresh)}},[pathname]);
 function submitSearch(e:React.FormEvent<HTMLFormElement>){e.preventDefault();window.location.href="/books"+(search.trim()?"?q="+encodeURIComponent(search.trim()):"")}
 const active=(href:string)=>href==="/" ? pathname==="/" : pathname===href||pathname.startsWith(href+"/");
 return <header className="site-header"><div className="site-header-inner">
 <Link href="/" className="brand" aria-label="BookNook Kids home" onClick={()=>setOpen(false)}><span className="brand-mark">📖</span><span className="brand-copy"><strong>BookNook <em>Kids</em></strong><small>A little world of big imagination</small></span></Link>
 <nav className="desktop-nav" aria-label="Main navigation">{navigation.map(n=><Link key={n.label} href={n.href} className={active(n.href)?"active":""}>{n.label}</Link>)}</nav>
 <form className="header-search" onSubmit={submitSearch}><span aria-hidden="true">⌕</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search e-books..." aria-label="Search e-books"/></form>
 <Link href="/wishlist" className="header-icon" aria-label="Wishlist">♡</Link><Link href="/cart" className="header-icon cart-icon" aria-label="Cart">🛒{cartCount>0&&<span>{cartCount}</span>}</Link><Link href="/login" className="login-button">Login</Link>
 <button type="button" className="mobile-menu-button" aria-expanded={open} aria-label="Toggle menu" onClick={()=>setOpen(v=>!v)}>{open?"×":"☰"}</button></div>
 {open&&<nav className="mobile-nav" aria-label="Mobile navigation">{navigation.map(n=><Link key={n.label} href={n.href} onClick={()=>setOpen(false)}>{n.label}</Link>)}<Link href="/wishlist">Wishlist</Link><Link href="/cart">Cart {cartCount||""}</Link><Link href="/account">My Account</Link><form className="mobile-search" onSubmit={submitSearch}><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search e-books..." aria-label="Search e-books"/><button>Search</button></form></nav>}</header>
}
export default SiteHeader;
