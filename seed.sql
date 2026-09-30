insert into public.categories (name, slug, description, icon)
values
('Adventure', 'adventure', 'Exciting journeys and discoveries.', '🚀'),
('Science', 'science', 'Science mysteries and fascinating ideas.', '🔬'),
('Mystery', 'mystery', 'Clues, puzzles and curious adventures.', '🌊'),
('Friendship', 'friendship', 'Stories about communication and genuine friendships.', '🤝'),
('Money & Life Skills', 'money-life-skills', 'Stories that make money and life skills easier to understand.', '💰'),
('Learning', 'learning', 'Fun stories that encourage learning.', '🧠'),
('Stories', 'stories', 'Wonderful stories for young readers.', '🌟')
on conflict (slug) do nothing;

insert into public.books
(title, slug, author, description, price, genre, age_category, published, featured)
values
('City Under the Sea', 'city-under-the-sea', 'Neetu Bansal',
 'A science mystery adventure involving AQUA-1 and a hidden danger beneath the ocean.',
 199, 'Science / Mystery', '6–16', false, true),
('Where Did All My Money Go?', 'where-did-all-my-money-go', 'Neetu Bansal',
 'A funny adventure that introduces young readers to saving, spending and compounding.',
 199, 'Money & Life Skills', '8–16', false, true),
('The Friendship Code', 'the-friendship-code', 'Neetu Bansal',
 'An illustrated journey through communication, confidence and genuine friendship.',
 199, 'Friendship', '10–18', false, false),
('Door2050', 'door2050', 'Neetu Bansal',
 'A young-reader adventure exploring a mysterious doorway and the future.',
 199, 'Adventure', '8–16', false, false)
on conflict (slug) do nothing;
