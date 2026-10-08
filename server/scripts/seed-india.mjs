import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../data/travel.db');
const db = new Database(dbPath);

console.log('Seeding India trips into:', dbPath);

// Get users
const users = db.prepare('SELECT id, username FROM users').all();
console.log('Users found:', users);

const categoryMap = {};
db.prepare('SELECT id, name FROM categories').all().forEach(c => {
  categoryMap[c.name.toLowerCase()] = c.id;
});

const sampleTrips = [
  {
    title: 'Golden Triangle: Delhi, Agra & Jaipur',
    description: 'Explore the imperial history, majestic forts, world wonders and vibrant bazaars of North India.',
    start_date: '2026-10-15',
    end_date: '2026-10-20',
    currency: 'INR',
    cover_image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1200&q=80',
    days: [
      {
        day_number: 1,
        date: '2026-10-15',
        title: 'Day 1: Historic Delhi & Chandni Chowk Food Trail',
        notes: 'Arrive in New Delhi, explore heritage landmarks and dive into Old Delhi delicacies.',
        places: [
          {
            name: 'India Gate & Kartavya Path',
            description: 'Iconic war memorial archway surrounded by sprawling lawns and fountains.',
            lat: 28.6129,
            lng: 77.2295,
            address: 'Rajpath, India Gate, New Delhi, Delhi 110001',
            category: 'attraction',
            price: 0,
            image_url: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80',
            duration_minutes: 90,
            notes: 'Great in the late afternoon. Enjoy ice cream along the lawns.'
          },
          {
            name: 'Qutub Minar Complex',
            description: 'UNESCO World Heritage 73-meter red sandstone minaret dating back to 1192.',
            lat: 28.5244,
            lng: 77.1855,
            address: 'Seth Sarai, Mehrauli, New Delhi, Delhi 110030',
            category: 'attraction',
            price: 50,
            image_url: 'https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&w=800&q=80',
            duration_minutes: 120,
            notes: 'Check out the ancient Rust-Free Iron Pillar.'
          },
          {
            name: 'Chandni Chowk & Paranthe Wali Gali',
            description: 'Legendary 17th-century market street renowned for stuffed paranthas, jalebi & chaat.',
            lat: 28.6506,
            lng: 77.2303,
            address: 'Chandni Chowk, Old Delhi, Delhi 110006',
            category: 'restaurant',
            price: 600,
            image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',
            duration_minutes: 150,
            notes: 'Take an e-rickshaw through the lively alleys.'
          }
        ]
      },
      {
        day_number: 2,
        date: '2026-10-16',
        title: 'Day 2: Delhi to Agra via Yamuna Expressway',
        notes: 'Morning drive to Agra, check in and witness sunset view of the Taj from Mehtab Bagh.',
        places: [
          {
            name: 'The Oberoi Amarvilas / Taj Viewpoint',
            description: 'Luxury stay with uninterrupted views of the Taj Mahal just 600 meters away.',
            lat: 27.1684,
            lng: 78.0494,
            address: 'Taj East Gate Rd, Paktola, Tajganj, Agra, UP 282001',
            category: 'hotel',
            price: 8500,
            image_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
            duration_minutes: 60,
            notes: 'Check-in time 2:00 PM.'
          },
          {
            name: 'Mehtab Bagh (Moonlight Garden)',
            description: 'Charbagh garden complex situated on the opposite bank of Yamuna offering magical sunset views.',
            lat: 27.1798,
            lng: 78.0421,
            address: 'Dharmapuri, Forest Colony, Tajganj, Agra, UP 282001',
            category: 'nature',
            price: 250,
            image_url: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80',
            duration_minutes: 120,
            notes: 'Bring DSLR camera for golden hour photography.'
          }
        ]
      },
      {
        day_number: 3,
        date: '2026-10-17',
        title: 'Day 3: Taj Mahal Sunrise & Majestic Agra Fort',
        notes: 'Sunrise at the world famous wonder of the world, followed by the Mughal imperial citadel.',
        places: [
          {
            name: 'Taj Mahal',
            description: 'Pinnacle of Mughal architecture built by Emperor Shah Jahan in memory of Mumtaz Mahal.',
            lat: 27.1751,
            lng: 78.0421,
            address: 'Dharmapuri, Forest Colony, Tajganj, Agra, UP 282001',
            category: 'attraction',
            price: 250,
            image_url: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80',
            duration_minutes: 180,
            notes: 'Enter through East Gate by 5:45 AM for crowd-free sunrise photography.'
          },
          {
            name: 'Agra Fort (Red Fort)',
            description: 'Massive red sandstone fortress that served as the main residence of Mughal emperors.',
            lat: 27.1795,
            lng: 78.0211,
            address: 'Agra Fort, Rakabganj, Agra, UP 282003',
            category: 'attraction',
            price: 50,
            image_url: 'https://images.unsplash.com/photo-1585136917192-3a525f0e34c9?auto=format&fit=crop&w=800&q=80',
            duration_minutes: 120,
            notes: 'Diwan-i-Khas and Jahangir Palace are architectural gems.'
          }
        ]
      },
      {
        day_number: 4,
        date: '2026-10-18',
        title: 'Day 4: Fatehpur Sikri & Journey to Pink City Jaipur',
        notes: 'En route stop at the deserted royal Mughal capital and arrival in Rajasthan.',
        places: [
          {
            name: 'Fatehpur Sikri & Buland Darwaza',
            description: '16th-century ghost city with the world tallest gateway built by Emperor Akbar.',
            lat: 27.0945,
            lng: 77.6679,
            address: 'Fatehpur Sikri, Uttar Pradesh 283110',
            category: 'attraction',
            price: 50,
            image_url: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=800&q=80',
            duration_minutes: 150,
            notes: 'Tie a thread at Salim Chishti Dargah for good fortune.'
          },
          {
            name: 'ITC Rajputana / Heritage Haveli',
            description: 'Regal Rajasthani hospitality with courtyard dining and traditional folk music.',
            lat: 26.9196,
            lng: 75.7925,
            address: 'Palace Road, Gopalbari, Jaipur, Rajasthan 302006',
            category: 'hotel',
            price: 7500,
            image_url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
            duration_minutes: 60,
            notes: 'Welcome with traditional garland and dhol.'
          }
        ]
      },
      {
        day_number: 5,
        date: '2026-10-19',
        title: 'Day 5: Royal Jaipur - Amer Fort, Hawa Mahal & Chokhi Dhani',
        notes: 'Hilltop fortress, honeycomb facade palace, and authentic Rajasthani village dinner.',
        places: [
          {
            name: 'Amber (Amer) Fort & Palace',
            description: 'Opulent fort perched high on a hill overlooking Maota Lake with the dazzling Sheesh Mahal.',
            lat: 26.9855,
            lng: 75.8513,
            address: 'Devisinghpura, Amer, Jaipur, Rajasthan 302001',
            category: 'attraction',
            price: 100,
            image_url: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
            duration_minutes: 180,
            notes: 'Must see: Sheesh Mahal (Palace of Mirrors).'
          },
          {
            name: 'Hawa Mahal (Palace of Winds)',
            description: 'Iconic 5-story pink honeycomb sandstone facade with 953 intricate jharokhas.',
            lat: 26.9239,
            lng: 75.8267,
            address: 'Hawa Mahal Rd, Badi Choupad, J.D.A. Market, Jaipur, Rajasthan 302002',
            category: 'attraction',
            price: 50,
            image_url: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=800&q=80',
            duration_minutes: 60,
            notes: 'Best clicked from Wind View Cafe across the street.'
          },
          {
            name: 'Chokhi Dhani Ethnic Resort & Village',
            description: 'Vibrant Rajasthani cultural fair featuring traditional puppet shows, camel rides & Dal Baati Churma feast.',
            lat: 26.7663,
            lng: 75.8362,
            address: '12 Miles Tonk Road, Goner Mod Flyover, Jaipur, Rajasthan 303905',
            category: 'activity',
            price: 1200,
            image_url: 'https://images.unsplash.com/photo-1596402184320-417e7178b2cd?auto=format&fit=crop&w=800&q=80',
            duration_minutes: 240,
            notes: 'Opens at 5:30 PM. Come with a huge appetite for the grand thali.'
          }
        ]
      }
    ],
    budget: [
      { category: 'Transport', name: 'Delhi-Agra-Jaipur Innova Cab & Fuel', total_price: 18500, note: '6-day private driver including toll and parking' },
      { category: 'Hotel', name: 'Agra & Jaipur Heritage Hotels (4 Nights)', total_price: 24000, note: 'Double room with breakfast' },
      { category: 'Food', name: 'Meals, Street Food & Chokhi Dhani Dinner', total_price: 11000, note: 'Delhi chaat, Mughlai dining & Rajasthani Thali' },
      { category: 'Attractions', name: 'Monuments & Entry Tickets (Taj, Forts, Qutub)', total_price: 3200, note: 'Online ASI monument bookings' },
      { category: 'Shopping', name: 'Jaipur Blue Pottery, Block Prints & Agra Petha', total_price: 7500, note: 'Bapu Bazaar & Johari Bazaar' }
    ],
    packing: [
      { category: 'Documents', name: 'Aadhaar / ID Card & Monument Tickets', checked: 1 },
      { category: 'Clothing', name: 'Comfortable cotton kurtas / breathable tees', checked: 1 },
      { category: 'Footwear', name: 'Easy slip-on walking shoes for temple/fort walks', checked: 0 },
      { category: 'Electronics', name: 'Camera, SD cards & 20000mAh Powerbank', checked: 1 },
      { category: 'Sun & Health', name: 'Sunscreen SPF 50, Sunglasses & ORS sachets', checked: 0 }
    ]
  },
  {
    title: 'Goa Sunshine & Coastal Escape: North & South',
    description: 'Sun, sand, Portuguese heritage villas, spice plantations and unforgettable beach sunsets.',
    start_date: '2026-11-05',
    end_date: '2026-11-10',
    currency: 'INR',
    cover_image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80',
    days: [
      {
        day_number: 1,
        date: '2026-11-05',
        title: 'Day 1: Arrival & North Goa Beach Shacks',
        notes: 'Landing at Mopa Airport, checking in at Anjuna and enjoying sea breeze.',
        places: [
          {
            name: 'W Goa / Anjuna Beach Resort',
            description: 'Vibrant beachfront luxury resort overlooking Vagator beach cliffs.',
            lat: 15.5978,
            lng: 73.7380,
            address: 'Vagator Beach, Bardez, Goa 403509',
            category: 'hotel',
            price: 9500,
            image_url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
            duration_minutes: 60,
            notes: 'Direct beach access.'
          },
          {
            name: 'Curlies & Shiva Valley Sunset Shacks',
            description: 'Legendary beachfront lounge famous for psychedelic vibes and sunset seafood.',
            lat: 15.5822,
            lng: 73.7431,
            address: 'Anjuna Beach, Monteiro Vaddo, Anjuna, Goa 403509',
            category: 'bar/cafe',
            price: 1500,
            image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
            duration_minutes: 180,
            notes: 'Try butter garlic prawns and fresh coconut water.'
          }
        ]
      },
      {
        day_number: 2,
        date: '2026-11-06',
        title: 'Day 2: Forts, Scenic Cliffs & Sunset Dining',
        notes: 'Exploring historic coastal bastions and clifftop Greek cuisine.',
        places: [
          {
            name: 'Chapora Fort (Dil Chahta Hai Point)',
            description: 'Historic red-laterite fort overlooking Vagator beach, immortalized in Bollywood cinema.',
            lat: 15.6058,
            lng: 73.7389,
            address: 'Chapora, Goa 403519',
            category: 'attraction',
            price: 0,
            image_url: 'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?auto=format&fit=crop&w=800&q=80',
            duration_minutes: 90,
            notes: 'Short uphill walk. Wear sneakers.'
          },
          {
            name: 'Thalassa Greek Taverna',
            description: 'Stunning sunset dining lounge with Mediterranean cuisine and live fire dances.',
            lat: 15.5997,
            lng: 73.7371,
            address: 'Siolim, Vaddy, Goa 403517',
            category: 'restaurant',
            price: 2500,
            image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
            duration_minutes: 150,
            notes: 'Book table in advance for 5:30 PM sunset slot.'
          }
        ]
      },
      {
        day_number: 3,
        date: '2026-11-07',
        title: 'Day 3: Dudhsagar Waterfalls Safari & Spice Plantation',
        notes: 'Thrilling open jeep safari through Bhagwan Mahavir Wildlife Sanctuary.',
        places: [
          {
            name: 'Dudhsagar Falls Safari',
            description: 'Four-tiered sea of milk waterfall crashing down 310 meters amidst lush Western Ghats jungle.',
            lat: 15.3144,
            lng: 74.3143,
            address: 'Sonaulim, Goa 403410',
            category: 'nature',
            price: 1800,
            image_url: 'https://images.unsplash.com/photo-1582650625119-3a31f8418b7d?auto=format&fit=crop&w=800&q=80',
            duration_minutes: 300,
            notes: 'Life jacket mandatory for swimming in natural pool.'
          },
          {
            name: 'Sahakari Spice Farm',
            description: 'Aromatic guided tour of vanilla, cardamom, black pepper trees followed by traditional buffet on banana leaves.',
            lat: 15.4208,
            lng: 74.0289,
            address: 'Ponda-Belgaum Highway, Curti, Ponda, Goa 403401',
            category: 'activity',
            price: 600,
            image_url: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=800&q=80',
            duration_minutes: 120,
            notes: 'Herbal welcome tea and cashew feni tasting.'
          }
        ]
      },
      {
        day_number: 4,
        date: '2026-11-08',
        title: 'Day 4: South Goa Serenity - Palolem & Cabo de Rama',
        notes: 'Pristine crescent beaches, kayaking with dolphins and secluded cliff views.',
        places: [
          {
            name: 'Palolem Beach & Butterfly Island',
            description: 'Crescent white-sand bay fringed with coconut palms and gentle warm water.',
            lat: 15.0100,
            lng: 74.0232,
            address: 'Canacona, South Goa, Goa 403702',
            category: 'beach',
            price: 800,
            image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
            duration_minutes: 240,
            notes: 'Rent a double kayak to paddle to Butterfly Beach.'
          },
          {
            name: 'Cabo de Rama Fort & Cliff Viewpoint',
            description: 'Dramatic cliffside ruined Portuguese fort overlooking endless Arabian sea expanse.',
            lat: 15.0883,
            lng: 73.9217,
            address: 'Taluka Cabo de Rama, Canacona, Goa 403702',
            category: 'attraction',
            price: 0,
            image_url: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
            duration_minutes: 90,
            notes: 'Spectacular 360-degree ocean view.'
          }
        ]
      }
    ],
    budget: [
      { category: 'Transport', name: 'Self-drive Thar / Scooty Rental & Fuel', total_price: 12000, note: '5 days self-drive freedom' },
      { category: 'Hotel', name: 'Boutique Beach Cottages (4 Nights)', total_price: 26000, note: '2 nights North Goa + 2 nights South Goa' },
      { category: 'Food', name: 'Goan Fish Curry, Shacks & Fine Dining', total_price: 14500, note: 'Seafood feasts, poi bread, feni & cocktails' },
      { category: 'Activity', name: 'Water Sports, Kayaking & Dudhsagar Safari', total_price: 6000, note: 'Jet ski, parasailing & jeep safari' }
    ],
    packing: [
      { category: 'Beachwear', name: 'Swimwear, quick-dry shorts & linen shirts', checked: 1 },
      { category: 'Protection', name: 'Water-resistant Sunscreen, Aloevera gel & Hat', checked: 1 },
      { category: 'Gear', name: 'Waterproof mobile pouch & Snorkel mask', checked: 0 },
      { category: 'Footwear', name: 'Flip-flops & water shoes', checked: 1 }
    ]
  },
  {
    title: 'Spiti Valley & Manali: Epic Himalayan Expedition',
    description: 'High-altitude cold desert, ancient Tibetan monasteries, highest post office and starry skies.',
    start_date: '2026-12-01',
    end_date: '2026-12-07',
    currency: 'INR',
    cover_image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=80',
    days: [
      {
        day_number: 1,
        date: '2026-12-01',
        title: 'Day 1: Old Manali Vibes & Hadimba Devi',
        notes: 'Acclimatize in cedar forests of Manali and enjoy live acoustic cafe music.',
        places: [
          {
            name: 'Old Manali Cafe 1947',
            description: 'Cozy wooden riverside cafe with Italian pizza, trout fish and mountain vibes.',
            lat: 32.2570,
            lng: 77.1750,
            address: 'Old Manali, Manali, Himachal Pradesh 175131',
            category: 'bar/cafe',
            price: 900,
            image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
            duration_minutes: 120,
            notes: 'Sit on the balcony over Manalsu river.'
          },
          {
            name: 'Hadimba Devi Temple & Cedar Woods',
            description: '16th-century four-tier wooden pagoda temple built in dense Dhungri deodar forests.',
            lat: 32.2483,
            lng: 77.1706,
            address: 'Hadimba Temple Rd, Old Manali, Manali, HP 175131',
            category: 'attraction',
            price: 0,
            image_url: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=800&q=80',
            duration_minutes: 90,
            notes: 'Rent traditional Himachali attire for photo souvenir.'
          }
        ]
      },
      {
        day_number: 2,
        date: '2026-12-02',
        title: 'Day 2: Atal Tunnel & Crossing into Spiti Valley',
        notes: 'Drive through the 9.02 km engineering marvel under Rohtang Pass towards Kaza.',
        places: [
          {
            name: 'Atal Tunnel (Rohtang)',
            description: 'World longest highway tunnel above 10,000 feet connecting Kullu to Lahaul & Spiti.',
            lat: 32.4042,
            lng: 77.1643,
            address: 'Leh-Manali Highway, Himachal Pradesh 175140',
            category: 'transport',
            price: 0,
            image_url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
            duration_minutes: 60,
            notes: 'Dramatic transition from lush green Kullu to snow-clad Lahaul landscape.'
          },
          {
            name: 'Key (Kye) Gompa Monastery',
            description: '1000-year-old fort-like Tibetan monastery perched atop a conical hill at 13,668 feet.',
            lat: 32.2982,
            lng: 78.0125,
            address: 'Key Village, Spiti, Himachal Pradesh 172114',
            category: 'attraction',
            price: 0,
            image_url: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80',
            duration_minutes: 180,
            notes: 'Monks offer hot herbal Spiti tea to travelers.'
          }
        ]
      },
      {
        day_number: 3,
        date: '2026-12-03',
        title: 'Day 3: Hikkim (Highest Post Office) & Komic Village',
        notes: 'Post letters from 14,567 feet and explore Asia highest motorable settlement.',
        places: [
          {
            name: 'Hikkim Post Office (World Highest)',
            description: 'Legendary post office at 14,567 ft where you can mail handwritten postcards across the globe.',
            lat: 32.2356,
            lng: 78.0678,
            address: 'Hikkim Village, Spiti Valley, HP 172114',
            category: 'activity',
            price: 200,
            image_url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
            duration_minutes: 90,
            notes: 'Buy handcrafted postcards and local stamps.'
          },
          {
            name: 'Chandratal (Moon Lake)',
            description: 'Crescent-shaped high-altitude turquoise lake reflecting Himalayan peaks like a crystal mirror.',
            lat: 32.4824,
            lng: 77.6154,
            address: 'Spiti Valley, Himachal Pradesh 175140',
            category: 'nature',
            price: 0,
            image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
            duration_minutes: 240,
            notes: 'Stargazing at night reveals the Milky Way in full glory.'
          }
        ]
      }
    ],
    budget: [
      { category: 'Transport', name: '4x4 Scorpio / Gypsy Expedition Rental', total_price: 32000, note: '7 days including high-altitude permits and diesel' },
      { category: 'Hotel', name: 'Homestays & Swiss Camping Tents', total_price: 18000, note: 'Authentic mud homestays with bukhari room heaters' },
      { category: 'Food', name: 'Tibetan Thukpa, Momos, Siddu & Meals', total_price: 8500, note: 'Nutritious mountain diet & butter tea' },
      { category: 'Gear', name: 'Thermal suits, trekking poles & oxygen can rental', total_price: 4500, note: 'High altitude essential prep' }
    ],
    packing: [
      { category: 'Warm Wear', name: '-10°C Down Jacket, Fleece & Thermal inners', checked: 1 },
      { category: 'Health', name: 'Diamox (Altitude sickness), Camphor & First Aid kit', checked: 1 },
      { category: 'Accessories', name: 'UV Protection Sunglasses, Balaclava & Woolen gloves', checked: 1 },
      { category: 'Cash', name: 'Hard cash (No ATMs after Kaza)', checked: 1 }
    ]
  },
  {
    title: 'Kerala Backwaters & Munnar Tea Trails',
    description: 'God’s own country: rolling mist-covered tea gardens, luxury houseboats and authentic Ayurveda.',
    start_date: '2026-12-20',
    end_date: '2026-12-25',
    currency: 'INR',
    cover_image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80',
    days: [
      {
        day_number: 1,
        date: '2026-12-20',
        title: 'Day 1: Fort Kochi Heritage & Kathakali Night',
        notes: 'Colonial streets, giant cantilevered Chinese fishing nets and cultural performance.',
        places: [
          {
            name: 'Chinese Fishing Nets & Fort Kochi Beach',
            description: 'Iconic 14th-century cantilevered fishing mechanisms silhouetted against the sunset.',
            lat: 9.9658,
            lng: 76.2421,
            address: 'River Rd, Fort Kochi, Kochi, Kerala 682001',
            category: 'attraction',
            price: 50,
            image_url: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=800&q=80',
            duration_minutes: 120,
            notes: 'Watch the fishermen operate the massive counterweights.'
          }
        ]
      },
      {
        day_number: 2,
        date: '2026-12-21',
        title: 'Day 2: Scenic Drive to Munnar & Tea Plantations',
        notes: 'Passing through waterfalls and carpets of lush green emerald tea estates.',
        places: [
          {
            name: 'Kolukkumalai Tea Estate (Highest in the World)',
            description: 'Panoramic tea gardens at 7,900 ft producing traditional orthodox tea since British era.',
            lat: 10.0889,
            lng: 77.1856,
            address: 'Kottakudi, Munnar, Kerala 685612',
            category: 'nature',
            price: 450,
            image_url: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80',
            duration_minutes: 180,
            notes: 'Take an open 4x4 jeep ride through the misty trails.'
          }
        ]
      },
      {
        day_number: 3,
        date: '2026-12-22',
        title: 'Day 3: Alleppey Luxury Private Houseboat',
        notes: 'Drifting along palm-fringed canals with freshly caught Karimeen Pollichathu.',
        places: [
          {
            name: 'Alleppey (Alappuzha) Houseboat Cruise',
            description: 'Traditional Kettuvallam converted into a floating luxury villa with personal chef.',
            lat: 9.4981,
            lng: 76.3388,
            address: 'Finishing Point, Punnamada, Alappuzha, Kerala 688013',
            category: 'hotel',
            price: 14000,
            image_url: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=800&q=80',
            duration_minutes: 720,
            notes: 'Includes welcome drinks, traditional Kerala Sadhya on banana leaf, and overnight stay.'
          }
        ]
      }
    ],
    budget: [
      { category: 'Transport', name: 'AC Sedan Taxi (Kochi - Munnar - Alleppey)', total_price: 14000, note: '5-day sanitized cab with chauffeur' },
      { category: 'Hotel', name: 'Munnar Tea Resort + Alleppey Luxury Houseboat', total_price: 28000, note: 'All-inclusive premium stays' },
      { category: 'Food', name: 'Appam, Stew, Kerala Parotta & Sadhya', total_price: 7500, note: 'Authentic local cuisine' },
      { category: 'Activity', name: 'Ayurvedic Abhyanga Spa & Spice Farm Tour', total_price: 5000, note: 'Rejuvenation therapy' }
    ],
    packing: [
      { category: 'Clothing', name: 'Light cottons, umbrella & light cardigan for Munnar', checked: 1 },
      { category: 'Health', name: 'Mosquito repellent (Odomos) & personal meds', checked: 1 },
      { category: 'Camera', name: 'Action camera & waterproof bag', checked: 0 }
    ]
  }
];

// Insert for each user
for (const user of users) {
  console.log(`Seeding trips for user: ${user.username} (ID: ${user.id})`);
  
  for (const t of sampleTrips) {
    const existing = db.prepare('SELECT id FROM trips WHERE user_id = ? AND title = ?').get(user.id, t.title);
    if (existing) {
      console.log(`Trip "${t.title}" already exists for ${user.username}, skipping...`);
      continue;
    }

    const res = db.prepare(`
      INSERT INTO trips (user_id, title, description, start_date, end_date, currency, cover_image)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(user.id, t.title, t.description, t.start_date, t.end_date, t.currency, t.cover_image);

    const tripId = res.lastInsertRowid;
    console.log(`Created trip: "${t.title}" (ID: ${tripId})`);

    // Insert days & places
    for (const d of t.days) {
      const dayRes = db.prepare(`
        INSERT INTO days (trip_id, day_number, date, title, notes)
        VALUES (?, ?, ?, ?, ?)
      `).run(tripId, d.day_number, d.date, d.title, d.notes);
      const dayId = dayRes.lastInsertRowid;

      if (d.places) {
        let orderIdx = 0;
        for (const p of d.places) {
          const catId = categoryMap[p.category] || categoryMap['attraction'] || 3;
          const placeRes = db.prepare(`
            INSERT INTO places (trip_id, name, description, lat, lng, address, category_id, price, currency, duration_minutes, notes, image_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(tripId, p.name, p.description, p.lat, p.lng, p.address, catId, p.price, 'INR', p.duration_minutes, p.notes, p.image_url);
          const placeId = placeRes.lastInsertRowid;

          db.prepare(`
            INSERT INTO day_assignments (day_id, place_id, order_index, notes)
            VALUES (?, ?, ?, ?)
          `).run(dayId, placeId, orderIdx++, p.notes);
        }
      }
    }

    // Insert budget items
    if (t.budget) {
      let bOrder = 0;
      for (const b of t.budget) {
        db.prepare(`
          INSERT INTO budget_items (trip_id, category, name, total_price, note, sort_order)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(tripId, b.category, b.name, b.total_price, b.note, bOrder++);
      }
    }

    // Insert packing items
    if (t.packing) {
      let pOrder = 0;
      for (const pk of t.packing) {
        db.prepare(`
          INSERT INTO packing_items (trip_id, name, checked, category, sort_order)
          VALUES (?, ?, ?, ?, ?)
        `).run(tripId, pk.name, pk.checked, pk.category, pOrder++);
      }
    }
  }
}

console.log('India data seeded successfully!');
