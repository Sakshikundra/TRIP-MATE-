import React, { useState, useMemo } from 'react'
import Navbar from '../components/Layout/Navbar'
import {
  Sparkles,
  MapPin,
  Calendar,
  DollarSign,
  Coffee,
  Wifi,
  Home,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Filter,
  Search,
  Users,
  Award,
  Heart,
  Send,
  X,
  Compass,
  Star,
  Zap,
  Briefcase,
  Check
} from 'lucide-react'
import { useToast } from '../components/shared/Toast'

interface VolunteerOpportunity {
  id: string
  title: string
  hostName: string
  location: string
  state: string
  region: 'Himachal' | 'Uttarakhand' | 'Goa' | 'Kerala' | 'Rajasthan' | 'NorthEast'
  category: 'content' | 'hostel' | 'art' | 'farming' | 'yoga' | 'music' | 'tech'
  duration: string
  stipend: string
  perks: string[]
  skills: string[]
  hoursPerDay: string
  minCommitment: string
  spotsLeft: number
  rating: number
  reviewCount: number
  imageUrl: string
  description: string
  responsibilities: string[]
  whatYouGet: string[]
  verified: boolean
}

const VOLUNTEER_PROJECTS: VolunteerOpportunity[] = [
  {
    id: 'rishikesh-content-nomad',
    title: 'Visual Storyteller & Content Creator at Riverside Camps',
    hostName: 'Ganga Whispers Eco-Resort',
    location: 'Kaudiyala, Rishikesh',
    state: 'Uttarakhand',
    region: 'Uttarakhand',
    category: 'content',
    duration: '3 Weeks - 2 Months',
    stipend: '₹12,000 / month',
    perks: ['Free Wooden Cottage Stay', '3 Organic Buffet Meals', 'Rafting Passes', '100 Mbps Starlink WiFi'],
    skills: ['Reels & Video Editing', 'Drone/DSLR Photography', 'Canva / Social Media'],
    hoursPerDay: '3-4 hrs / day',
    minCommitment: '21 Days',
    spotsLeft: 2,
    rating: 4.9,
    reviewCount: 38,
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    description: 'Live right on the banks of holy river Ganga. Capture the serene morning aartis, riverside yoga sessions, and adventure rafting thrills while creating engaging social media content.',
    responsibilities: [
      'Create 4-5 high quality Instagram Reels per week',
      'Photograph guest experiences and camp amenities',
      'Manage daily Instagram stories and engage with travel community'
    ],
    whatYouGet: [
      'Private river-facing luxury tent/cottage',
      'All daily meals & snacks from the organic camp kitchen',
      'Complimentary river rafting and cliff jumping sessions',
      'Official Certificate of Media Residency & ₹12,000 monthly stipend'
    ],
    verified: true,
  },
  {
    id: 'manali-hostel-host',
    title: 'Hostel Experience & Community Manager at Himalayan Den',
    hostName: 'The Himalayan Nomad Hostel',
    location: 'Old Manali',
    state: 'Himachal Pradesh',
    region: 'Himachal',
    category: 'hostel',
    duration: '4 Weeks - 3 Months',
    stipend: '₹10,000 / month',
    perks: ['Private Attic Room', 'Unlimited Cafe Food & Chai', 'Trek Gear Access', 'High-Speed Fiber Net'],
    skills: ['Community Hosting', 'Acoustic Jam Sessions', 'Guest Relations', 'Event Planning'],
    hoursPerDay: '4 hrs / day',
    minCommitment: '1 Month',
    spotsLeft: 1,
    rating: 4.95,
    reviewCount: 52,
    imageUrl: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80',
    description: 'Immerse yourself in apple orchards and snow peaks of Old Manali. Organize bonfire evenings, board game nights, and guided village walks for backpackers from all over the world.',
    responsibilities: [
      'Welcome arriving travelers and introduce them to Old Manali hidden gems',
      'Host evening bonfires, live jamming and pub crawls',
      'Coordinate with housekeeping and local trek guides'
    ],
    whatYouGet: [
      'Cozy wooden attic room with balcony facing snow peaks',
      'Full meals from the in-house rooftop cafe',
      'Free rental of mountain bikes and trekking gear',
      '₹10,000/mo pocket allowance'
    ],
    verified: true,
  },
  {
    id: 'dehradun-wall-mural-residency',
    title: 'Vibrant Wall Murals & Cafe Art Residency in the Foothills',
    hostName: 'Jungle Bloom Art Cafe & Homestay',
    location: 'Dehradun Foothills',
    state: 'Uttarakhand',
    region: 'Uttarakhand',
    category: 'art',
    duration: '2 Weeks - 4 Weeks',
    stipend: '₹15,000 project bonus',
    perks: ['Private Art Studio', 'Artisan Coffee & Meals', 'Free Art Supplies', 'Mountain View Deck'],
    skills: ['Wall Murals & Acrylics', 'Creative Lettering', 'Visual Designing'],
    hoursPerDay: '3-4 hrs / day',
    minCommitment: '14 Days',
    spotsLeft: 2,
    rating: 4.88,
    reviewCount: 29,
    imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
    description: 'Turn white walls into vibrant stories of Himalayan flora, wildlife and wanderlust. An inspiring residency with all painting materials and canvas provided.',
    responsibilities: [
      'Paint 2-3 feature wall murals across the cafe courtyard',
      'Design artistic blackboard menu displays',
      'Host an informal weekend art workshop for homestay guests'
    ],
    whatYouGet: [
      'Independent artist suite overlooking Sal forest',
      'All painting supplies, paints and brushes sponsored',
      'Unlimited espresso, bakery treats & home-cooked meals',
      '₹15,000 completion honorarium'
    ],
    verified: true,
  },
  {
    id: 'kerala-organic-permaculture',
    title: 'Organic Tea & Permaculture Volunteer in God’s Own Country',
    hostName: 'Spice Valley Bio-Farm',
    location: 'Munnar / Wayanad',
    state: 'Kerala',
    region: 'Kerala',
    category: 'farming',
    duration: '3 Weeks - 6 Weeks',
    stipend: '₹8,500 / month',
    perks: ['Treehouse Stay', 'Farm-to-table Kerala Meals', 'Daily Morning Yoga', 'Spice Tour Guide'],
    skills: ['Eco-Gardening', 'Organic Farming', 'Herbal Plant Knowledge', 'Nature Enthusiast'],
    hoursPerDay: '3 hrs / day',
    minCommitment: '20 Days',
    spotsLeft: 3,
    rating: 4.92,
    reviewCount: 44,
    imageUrl: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80',
    description: 'Live surrounded by misty rolling tea hills and spice plantations. Learn sustainable farming, harvest black pepper & cardamom, and experience tranquil village life.',
    responsibilities: [
      'Help maintain organic herbal beds and nursery',
      'Assist in tea plucking and artisanal spice processing',
      'Accompany guests on tranquil nature trail walks'
    ],
    whatYouGet: [
      'Rustic traditional treehouse accommodation',
      'Authentic Kerala meals served on fresh banana leaves',
      'Complimentary Ayurvedic rejuvenation massage once a week',
      '₹8,500 monthly travel stipend'
    ],
    verified: true,
  },
  {
    id: 'goa-sunset-yoga-wellness',
    title: 'Sunset Beach Yoga & Wellness Host in South Goa',
    hostName: 'Nirvana Ocean Breeze Retreat',
    location: 'Palolem Beach, South Goa',
    state: 'Goa',
    region: 'Goa',
    category: 'yoga',
    duration: '1 Month - 3 Months',
    stipend: '₹18,000 / month',
    perks: ['Beachfront Wooden Shack', 'Healthy Smoothies & Meals', 'Scooty Provided', 'Ocean Views'],
    skills: ['Hatha / Vinyasa Yoga', 'Breathwork & Meditation', 'Warm Guest Interactions'],
    hoursPerDay: '3 hrs / day',
    minCommitment: '30 Days',
    spotsLeft: 1,
    rating: 4.98,
    reviewCount: 61,
    imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
    description: 'Wake up to the sound of crashing waves and coconut palms. Lead relaxing morning and sunset yoga sessions on the white sands of Palolem.',
    responsibilities: [
      'Lead 1 morning and 1 sunset gentle yoga / pranayama class daily',
      'Create a warm, peaceful atmosphere for wellness retreat guests',
      'Assist in arranging beach detox workshops'
    ],
    whatYouGet: [
      'Private beach shack 20 steps from the water',
      'Fresh fruit bowls, smoothies and all meals',
      'Honda Activa / Scooty with fuel provided for local exploration',
      '₹18,000 monthly coaching stipend'
    ],
    verified: true,
  },
  {
    id: 'rajasthan-haveli-music-events',
    title: 'Acoustic Performer & Cultural Night Host at Heritage Haveli',
    hostName: 'Desert Dune Cultural Club',
    location: 'Pushkar / Jodhpur',
    state: 'Rajasthan',
    region: 'Rajasthan',
    category: 'music',
    duration: '2 Weeks - 2 Months',
    stipend: '₹14,000 / month',
    perks: ['Heritage Haveli Suite', 'Royal Rajasthani Thali', 'Desert Safari Excursions', 'Musical Stage'],
    skills: ['Guitar / Vocals', 'Jam Session Hosting', 'Stage Management', 'Enthusiastic Performer'],
    hoursPerDay: '2.5 hrs / day',
    minCommitment: '15 Days',
    spotsLeft: 2,
    rating: 4.86,
    reviewCount: 31,
    imageUrl: 'https://images.unsplash.com/photo-1596402184320-417e7178b2cd?auto=format&fit=crop&w=800&q=80',
    description: 'Perform under starry desert skies in a 200-year-old carved sandstone courtyard. Bring travelers together with soul-stirring melodies and acoustic jam nights.',
    responsibilities: [
      'Host 4-5 evening acoustic rooftop sessions per week',
      'Collaborate with local Rajasthani folk artists (Sarangi & Khartal players)',
      'Organize open-mic evenings for travelers'
    ],
    whatYouGet: [
      'Royal heritage suite with jharokha balcony',
      'Grand Rajasthani breakfast and dinner daily',
      'Desert camel safari and overnight camp passes',
      '₹14,000 monthly performance stipend'
    ],
    verified: true,
  },
  {
    id: 'spiti-digital-nomad-dev',
    title: 'Full-Stack Web Dev & Tech Nomad Residency at 10,000 ft',
    hostName: 'Alt-Life Mountain Coliving',
    location: 'Dharamkot / Spiti Valley',
    state: 'Himachal Pradesh',
    region: 'Himachal',
    category: 'tech',
    duration: '1 Month - 6 Months',
    stipend: '₹20,000 / month',
    perks: ['Private Studio Apartment', 'Dedicated 200 Mbps Desk', 'Unlimited Specialty Coffee', 'Heated Rooms'],
    skills: ['React / TypeScript', 'Web Optimization', 'CMS & Automation'],
    hoursPerDay: '3-4 hrs / day',
    minCommitment: '30 Days',
    spotsLeft: 1,
    rating: 4.97,
    reviewCount: 47,
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    description: 'Code with panoramic Himalayan views, high-speed fiber internet and wood-fired heaters. Help upgrade internal booking systems while living the dream mountain workation.',
    responsibilities: [
      'Maintain and polish the community website and automated booking flows',
      'Help troubleshoot local tech/wifi hardware setup if needed',
      'Share tech insights in monthly community meetups'
    ],
    whatYouGet: [
      'Furnished mountain studio with heating & ergonomic workstation',
      'Unlimited gourmet coffee, breakfast and meals',
      'Weekend guided high-altitude treks',
      '₹20,000 monthly stipend'
    ],
    verified: true,
  }
]

export default function VolunteerPage() {
  const toast = useToast()
  const [selectedRegion, setSelectedRegion] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [activeModalProject, setActiveModalProject] = useState<VolunteerOpportunity | null>(null)
  const [appliedProjects, setAppliedProjects] = useState<string[]>([])
  
  // Application form state
  const [applicantName, setApplicantName] = useState('')
  const [applicantEmail, setApplicantEmail] = useState('')
  const [applicantPhone, setApplicantPhone] = useState('')
  const [applicantSkills, setApplicantSkills] = useState('')
  const [applicantDates, setApplicantDates] = useState('')
  const [applicantMotivation, setApplicantMotivation] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [savedFavorites, setSavedFavorites] = useState<string[]>([])

  const filteredProjects = useMemo(() => {
    return VOLUNTEER_PROJECTS.filter(p => {
      if (selectedRegion !== 'all' && p.region !== selectedRegion) return false
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const match =
          p.title.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          p.hostName.toLowerCase().includes(q) ||
          p.skills.some(s => s.toLowerCase().includes(q))
        if (!match) return false
      }
      return true
    })
  }, [selectedRegion, selectedCategory, searchQuery])

  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSavedFavorites(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
    toast.success(savedFavorites.includes(id) ? 'Removed from saved' : 'Added to saved opportunities! ❤️')
  }

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!applicantName || !applicantEmail || !applicantPhone) {
      toast.error('Please fill all required fields')
      return
    }

    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      if (activeModalProject) {
        setAppliedProjects(prev => [...prev, activeModalProject.id])
      }
      toast.success(`🎉 Application submitted for ${activeModalProject?.title}! Host will contact you on WhatsApp within 24 hrs.`)
      setActiveModalProject(null)
      // reset fields
      setApplicantMotivation('')
    }, 900)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', paddingBottom: 80 }}>
      <Navbar />

      <main style={{ paddingTop: 'calc(var(--nav-h) + 16px)' }} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <section
          style={{
            position: 'relative',
            borderRadius: 28,
            overflow: 'hidden',
            marginBottom: 36,
            background: 'linear-gradient(135deg, #092015 0%, #163e2b 50%, #2d6a4f 100%)',
            boxShadow: '0 12px 40px rgba(27,67,50,0.25)',
            color: 'white',
          }}
          className="p-8 sm:p-12 lg:p-16"
        >
          {/* Decorative mountain / glow backdrop */}
          <div
            style={{
              position: 'absolute',
              top: -60,
              right: -60,
              width: 320,
              height: 320,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(231,111,60,0.4) 0%, rgba(231,111,60,0) 70%)',
              filter: 'blur(50px)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: -40,
              left: 40,
              width: 280,
              height: 280,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(251,176,64,0.3) 0%, rgba(251,176,64,0) 70%)',
              filter: 'blur(60px)',
              pointerEvents: 'none',
            }}
          />

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs sm:text-sm font-semibold text-[#fbb040] mb-5">
              <Sparkles size={15} className="animate-pulse text-[#fbb040]" />
              <span>Volunteer Yatra • Travel, Learn & Earn</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.12] mb-4 text-white">
              You don&apos;t need another vacation.{' '}
              <span style={{ color: '#fbb040' }}>You need this.</span>
            </h1>

            <p className="text-base sm:text-xl text-white/85 font-medium leading-relaxed mb-8 max-w-2xl">
              India&apos;s Safest &amp; Most Trusted Platform for Skill-Based Travel. Exchange your skills for{' '}
              <strong className="text-white font-bold">Free Stays, Organic Food, Daily Chai &amp; Monthly Stipends</strong> across mountains, beaches and heritage havelis.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <a
                href="#opportunities-grid"
                style={{
                  background: 'linear-gradient(135deg, #e76f3c 0%, #f27d42 100%)',
                  boxShadow: '0 6px 20px rgba(231,111,60,0.4)',
                }}
                className="px-6 py-3.5 rounded-xl font-bold text-white flex items-center gap-2 hover:scale-[1.03] active:scale-95 transition-all text-sm sm:text-base cursor-pointer"
              >
                <span>Find Your First Opportunity</span>
                <ArrowRight size={18} />
              </a>

              <div className="flex items-center gap-6 text-xs sm:text-sm font-semibold text-white/90 px-2 py-1">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={18} className="text-[#52b788]" />
                  <span>100% Verified Hosts</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <DollarSign size={18} className="text-[#fbb040]" />
                  <span>Free Stay &amp; Stipend</span>
                </div>
              </div>
            </div>

            {/* Platform Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10 pt-8 border-t border-white/15">
              <div>
                <p className="text-2xl sm:text-3xl font-black text-white">5,000+</p>
                <p className="text-xs sm:text-sm text-white/70 font-medium">Volunteers Placed</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-white">500+</p>
                <p className="text-xs sm:text-sm text-white/70 font-medium">Verified Indian Hosts</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-white">45+</p>
                <p className="text-xs sm:text-sm text-white/70 font-medium">Dream Destinations</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-[#52b788]">₹0 Stay Cost</p>
                <p className="text-xs sm:text-sm text-white/70 font-medium">100% Free Food &amp; Bed</p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="mb-14">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">How Volunteer Yatra Works</h2>
            <p className="text-sm sm:text-base text-content-muted max-w-xl mx-auto">
              Start your journey in 3 simple steps — exchange 3-4 hours of passion for unforgettable travel experiences.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-primary)',
                borderRadius: 20,
                boxShadow: 'var(--shadow-sm)',
              }}
              className="p-6 sm:p-8 flex flex-col items-start relative hover:translate-y-[-2px] transition-transform"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xl mb-5">
                1
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2.5">Create Your Profile</h3>
              <p className="text-sm text-content-muted leading-relaxed">
                Tell us who you are, your top skills (Photography, Social Media, Art, Cooking, Yoga, Tech), and where you dream of traveling next.
              </p>
            </div>

            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-primary)',
                borderRadius: 20,
                boxShadow: 'var(--shadow-sm)',
              }}
              className="p-6 sm:p-8 flex flex-col items-start relative hover:translate-y-[-2px] transition-transform"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xl mb-5">
                2
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2.5">Choose Project &amp; Connect</h3>
              <p className="text-sm text-content-muted leading-relaxed">
                Browse 500+ verified mountain homestays, riverside camps, beach hostels &amp; eco-farms. Connect directly with the host.
              </p>
            </div>

            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-primary)',
                borderRadius: 20,
                boxShadow: 'var(--shadow-sm)',
              }}
              className="p-6 sm:p-8 flex flex-col items-start relative hover:translate-y-[-2px] transition-transform"
            >
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-xl mb-5">
                3
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2.5">Travel, Stay Free &amp; Earn</h3>
              <p className="text-sm text-content-muted leading-relaxed">
                Pack your bags! Enjoy complimentary private/dorm stay, fresh home-cooked meals, adventure perks and monthly cash stipends.
              </p>
            </div>
          </div>
        </section>

        {/* Opportunities Header & Filters */}
        <div id="opportunities-grid" className="scroll-mt-24 mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#e76f3c] mb-1">
                <Compass size={14} />
                <span>Verified Positions Available</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Wander-ful Volunteer Projects in India</h2>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search skills, cities, hosts..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-edge bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted hover:text-content"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Region Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none mb-3">
            {[
              { id: 'all', label: 'All Regions 🇮🇳' },
              { id: 'Himachal', label: 'Himachal & Spiti 🏔️' },
              { id: 'Uttarakhand', label: 'Uttarakhand / Rishikesh 🌊' },
              { id: 'Goa', label: 'Goa & Coastal 🏖️' },
              { id: 'Kerala', label: 'Kerala Tea & Backwaters 🌿' },
              { id: 'Rajasthan', label: 'Rajasthan Heritage 🏰' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedRegion(tab.id)}
                style={{
                  background: selectedRegion === tab.id ? 'var(--accent)' : 'var(--bg-card)',
                  color: selectedRegion === tab.id ? 'var(--accent-text)' : 'var(--text-secondary)',
                  border: `1px solid ${selectedRegion === tab.id ? 'var(--accent)' : 'var(--border-primary)'}`,
                }}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all shadow-sm flex-shrink-0 cursor-pointer"
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {[
              { id: 'all', label: 'All Skills' },
              { id: 'content', label: '📸 Content & Reels' },
              { id: 'hostel', label: '🏨 Hostel Community Host' },
              { id: 'art', label: '🎨 Wall Murals & Art' },
              { id: 'farming', label: '🌱 Organic Farming' },
              { id: 'yoga', label: '🧘 Yoga & Wellness' },
              { id: 'music', label: '🎸 Acoustic Music & Events' },
              { id: 'tech', label: '💻 Web Dev / Nomad' },
            ].map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  background: selectedCategory === cat.id ? '#e76f3c' : 'transparent',
                  color: selectedCategory === cat.id ? '#ffffff' : 'var(--text-muted)',
                  border: `1px solid ${selectedCategory === cat.id ? '#e76f3c' : 'var(--border-faint)'}`,
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 cursor-pointer"
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Opportunity Cards Grid */}
        {filteredProjects.length === 0 ? (
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-primary)',
              borderRadius: 20,
            }}
            className="p-12 text-center my-8"
          >
            <Compass size={44} className="mx-auto text-content-muted mb-3 opacity-60" />
            <h3 className="text-lg font-bold mb-1">No opportunities match your filter</h3>
            <p className="text-sm text-content-muted mb-4">Try clearing your search or switching to All Regions.</p>
            <button
              type="button"
              onClick={() => { setSelectedRegion('all'); setSelectedCategory('all'); setSearchQuery('') }}
              className="px-4 py-2 rounded-lg bg-[#1b4332] text-white font-semibold text-sm cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map(proj => {
              const isApplied = appliedProjects.includes(proj.id)
              const isFav = savedFavorites.includes(proj.id)

              return (
                <div
                  key={proj.id}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: 22,
                    boxShadow: 'var(--shadow-sm)',
                    overflow: 'hidden',
                  }}
                  className="flex flex-col group hover:shadow-lg transition-all duration-300"
                >
                  {/* Card Image */}
                  <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-900">
                    <img
                      src={proj.imageUrl}
                      alt={proj.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Location Badge */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-semibold">
                      <MapPin size={12} className="text-[#fbb040]" />
                      <span>{proj.location}</span>
                    </div>

                    {/* Verified & Spots left */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      {proj.verified && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/90 backdrop-blur-md text-white text-[11px] font-bold flex items-center gap-1">
                          <CheckCircle2 size={11} />
                          Verified
                        </span>
                      )}
                    </div>

                    {/* Favorite button */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleFavorite(proj.id, e)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                      aria-label="Save opportunity"
                    >
                      <Heart size={15} className={isFav ? 'fill-rose-500 text-rose-500' : 'text-white'} />
                    </button>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center justify-between text-xs text-content-muted mb-2">
                      <span className="font-semibold text-content-secondary">{proj.hostName}</span>
                      <div className="flex items-center gap-1 text-amber-500 font-bold">
                        <Star size={13} className="fill-amber-400 text-amber-400" />
                        <span>{proj.rating}</span>
                        <span className="text-content-faint">({proj.reviewCount})</span>
                      </div>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold leading-snug mb-2.5 text-content-primary line-clamp-2">
                      {proj.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-content-muted mb-4 line-clamp-2">
                      {proj.description}
                    </p>

                    {/* Perks Chips */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {proj.perks.slice(0, 3).map((perk, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 flex items-center gap-1"
                        >
                          <Check size={11} strokeWidth={3} />
                          {perk}
                        </span>
                      ))}
                    </div>

                    {/* Stipend & Duration Footer */}
                    <div className="mt-auto pt-3 border-t border-edge flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-medium text-content-faint block">Allowance</span>
                        <span className="text-sm font-extrabold text-[#e76f3c]">{proj.stipend}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveModalProject(proj)}
                        style={{
                          background: isApplied ? '#10b981' : 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)',
                        }}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 hover:opacity-95 transition-opacity cursor-pointer shadow-sm"
                      >
                        {isApplied ? (
                          <>
                            <CheckCircle2 size={13} />
                            Applied
                          </>
                        ) : (
                          <>
                            <span>View &amp; Apply</span>
                            <ArrowRight size={13} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Benefits banner */}
        <section
          style={{
            background: 'linear-gradient(135deg, rgba(231,111,60,0.08) 0%, rgba(251,176,64,0.08) 100%)',
            border: '1px solid rgba(231,111,60,0.2)',
            borderRadius: 24,
          }}
          className="p-8 sm:p-10 my-16 text-center"
        >
          <h3 className="text-xl sm:text-2xl font-bold mb-3">Are You A Host Looking for Talented Volunteers?</h3>
          <p className="text-sm text-content-muted max-w-2xl mx-auto mb-6">
            List your cafe, backpacker hostel, surf camp, farm or mountain resort. Welcome passionate storytellers, artists, managers and instructors to grow your space.
          </p>
          <button
            type="button"
            onClick={() => toast.info('Host onboarding opened! Form shared with coordinator.')}
            className="px-6 py-3 rounded-xl bg-[#1b4332] text-white font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-md cursor-pointer"
          >
            List Your Property As A Host 🏡
          </button>
        </section>
      </main>

      {/* Application / Detail Drawer Modal */}
      {activeModalProject && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-primary)',
              borderRadius: 24,
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              maxHeight: '90vh',
            }}
            className="w-full max-w-2xl overflow-y-auto relative p-6 sm:p-8"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setActiveModalProject(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 text-content-muted hover:text-content flex items-center justify-center transition-colors z-10"
            >
              <X size={18} />
            </button>

            {/* Header info */}
            <div className="flex items-start gap-4 mb-5">
              <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-800">
                <img src={activeModalProject.imageUrl} alt={activeModalProject.title} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#e76f3c] mb-1">
                  <MapPin size={12} />
                  <span>{activeModalProject.location}, {activeModalProject.state}</span>
                </div>
                <h3 className="text-xl font-bold leading-tight text-content-primary">{activeModalProject.title}</h3>
                <p className="text-xs text-content-muted mt-0.5">Host: {activeModalProject.hostName}</p>
              </div>
            </div>

            {/* Key stats row */}
            <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-edge text-center mb-5">
              <div>
                <span className="text-[11px] text-content-faint block">Work Hours</span>
                <span className="text-xs sm:text-sm font-bold text-content-primary">{activeModalProject.hoursPerDay}</span>
              </div>
              <div>
                <span className="text-[11px] text-content-faint block">Min Duration</span>
                <span className="text-xs sm:text-sm font-bold text-content-primary">{activeModalProject.minCommitment}</span>
              </div>
              <div>
                <span className="text-[11px] text-content-faint block">Stipend / Perks</span>
                <span className="text-xs sm:text-sm font-bold text-[#e76f3c]">{activeModalProject.stipend}</span>
              </div>
            </div>

            {/* What you get */}
            <div className="mb-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-content-secondary mb-2">What You Receive (100% Free):</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeModalProject.whatYouGet.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-content-secondary">
                    <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Application Form */}
            <form onSubmit={handleApplySubmit} className="pt-4 border-t border-edge">
              <h4 className="text-sm font-bold text-content-primary mb-3">Apply in 60 Seconds</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-semibold text-content-muted mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    value={applicantName}
                    onChange={e => setApplicantName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3 py-2 rounded-xl border border-edge bg-surface text-xs focus:ring-2 focus:ring-[#1b4332]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-content-muted mb-1">WhatsApp Number *</label>
                  <input
                    type="tel"
                    required
                    value={applicantPhone}
                    onChange={e => setApplicantPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-3 py-2 rounded-xl border border-edge bg-surface text-xs focus:ring-2 focus:ring-[#1b4332]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-semibold text-content-muted mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={applicantEmail}
                    onChange={e => setApplicantEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-3 py-2 rounded-xl border border-edge bg-surface text-xs focus:ring-2 focus:ring-[#1b4332]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-content-muted mb-1">Instagram / Portfolio URL</label>
                  <input
                    type="text"
                    value={applicantSkills}
                    onChange={e => setApplicantSkills(e.target.value)}
                    placeholder="instagram.com/username"
                    className="w-full px-3 py-2 rounded-xl border border-edge bg-surface text-xs focus:ring-2 focus:ring-[#1b4332]"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-content-muted mb-1">Why are you excited for this project?</label>
                <textarea
                  rows={2}
                  value={applicantMotivation}
                  onChange={e => setApplicantMotivation(e.target.value)}
                  placeholder="Share a short note about yourself and your preferred travel dates..."
                  className="w-full px-3 py-2 rounded-xl border border-edge bg-surface text-xs focus:ring-2 focus:ring-[#1b4332]"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveModalProject(null)}
                  className="px-4 py-2.5 rounded-xl border border-edge text-xs font-semibold text-content-muted hover:bg-surface-hover"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    background: 'linear-gradient(135deg, #e76f3c 0%, #f27d42 100%)',
                    boxShadow: '0 4px 14px rgba(231,111,60,0.3)',
                  }}
                  className="px-6 py-2.5 rounded-xl text-white font-bold text-xs flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Submitting Application...</span>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>Submit Application</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
