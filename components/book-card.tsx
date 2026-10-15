"use client";
import Image from "next/image";
import Link from "next/link";
type BookCardProps={book:{id:string;title:string;slug:string;author?:string|null;description?:string|null;price?:number|null;genre?:string|null;age_category?:string|null;is_free?:boolean;cover_path?:string|null;cover_url?:string|null}};
export function BookCard({book}:BookCardProps){
 const cover="/api/books/cover?slug="+encodeURIComponent(book.slug);
 const free=Boolean(book.is_free)||!(typeof book.price==="number"&&book.price>0);
 return <article className="book-card"><Link href={"/books/"+book.slug} className="book-card-link"><div className="book-cover"><Image src={cover} alt={book.title} fill sizes="(max-width:640px) 45vw,(max-width:1024px) 20vw,180px" className="book-cover-image"/></div><div className="book-card-body"><h3>{book.title}</h3>{book.author&&<p className="book-author">By {book.author}</p>}<div className="book-meta"><span>{book.age_category?"Ages "+book.age_category:(book.genre||"Digital e-book")}</span><strong>{free?"Free":"₹"+Number(book.price).toLocaleString("en-IN")}</strong></div><span className="book-view-button">View E-book</span></div></Link></article>
}
export default BookCard;
