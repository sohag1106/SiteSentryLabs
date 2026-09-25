/**
 * SiteSentryLabs — Team data
 *
 * Existing people are preserved. Advisor entries are clearly marked demo
 * placeholders and should be replaced before launch.
 */
const SITESENTRYLABS_TEAM = [
  {
    name: 'Shahan Shaon',
    role: 'Founder & CEO',
    category: 'Founder',
    bio: 'A skilled developer and technology innovator dedicated to building powerful, modern digital solutions. As the Founder of SiteSentryLabs, he leads the team in turning ambitious ideas into high-quality software and web experiences.',
    photo: 'assets/images/team/Shahan Shaon.svg',
    expertise: ['Web Development', 'Software Development', 'Cybersecurity', 'Digital Solutions'],
    social: { linkedin: '#LINKEDIN_URL', github: '#GITHUB_URL', instagram: '#INSTAGRAM_URL' }
  },
  {
    name: 'Faiaz Rahaman',
    role: 'Founder & CTO',
    category: 'Founder',
    bio: 'A technology enthusiast passionate about innovation, software development, and digital solutions. As Co-Founder of SiteSentryLabs, he transforms creative ideas into modern digital experiences that help businesses grow.',
    photo: 'assets/images/team/faiaz-rahaman.svg',
    expertise: ['Web Development', 'UI/UX Design', 'Design Systems', 'Digital Solutions'],
    social: { linkedin: '#LINKEDIN_URL', github: '#GITHUB_URL', instagram: '#INSTAGRAM_URL' }
  },
  {
    name: 'Mohammad Sohag',
    role: 'Technology Advisor',
    category: 'Advisor',
    demo: true,
    bio: 'Advisor at SiteSentryLabs and Founder of BrightSkyIT, specializing in secure, high-performance web platforms.He focuses on robust architecture, performance, and reliability, building websites and applications that stay fast and dependable.',
    photo: 'assets/images/team/advisor-placeholder-01.svg',
    expertise: ['Technology Strategy', 'Digital Transformation', 'Innovation'],
    social: { linkedin: '#LINKEDIN_URL', website: 'https://brightskyit.com/', instagram: '#INSTAGRAM_URL' }
  },
  {
    name: 'Reazul Hasan',
    role: 'Business Advisor',
    category: 'Advisor',
    demo: true,
    bio: 'He is the owner and founder of Quick Solution Oman (quicksolutionoman.com), a leading facility-management company serving clients across Oman from Muscat. His on-the-ground business expertise across the Gulf shapes SiteSentryLabs.',
    photo: 'assets/images/team/advisor-placeholder-02.svg',
    expertise: ['Business Strategy', 'Growth Planning', 'Operations'],
    social: { linkedin: '#LINKEDIN_URL', github: '#GITHUB_URL', instagram: '#INSTAGRAM_URL' }
  },
  {
    name: 'Advisor Name 03',
    role: 'Cybersecurity Advisor',
    category: 'Advisor — Demo Placeholder',
    demo: true,
    bio: 'Demo placeholder profile. Replace this text with the real advisor’s professional biography before publishing.',
    photo: 'assets/images/team/advisor-placeholder-03.svg',
    expertise: ['Cybersecurity', 'Risk Management', 'Security Architecture'],
    social: { linkedin: '#LINKEDIN_URL', github: '#GITHUB_URL', instagram: '#INSTAGRAM_URL' }
  },
  {
    name: 'Shehan Hasan',
    role: 'Strategy Advisor',
    category: 'Advisor',
    demo: true,
    bio: 'Demo placeholder profile. Replace this text with the real advisor’s professional biography before publishing.',
    photo: 'assets/images/team/advisor-placeholder-04.svg',
    expertise: ['Strategy', 'Product Planning', 'Market Development'],
    social: { linkedin: '#LINKEDIN_URL', github: '#GITHUB_URL', instagram: '#INSTAGRAM_URL' }
  },
  {
    name: 'Apurba Barua',
    role: 'HR & Social Media Manager',
    category: 'Member',
    bio: 'Motivated professional skilled in HR, recruitment, social media management, communication, and team coordination',
    photo: 'assets/images/team/Apurba Barua.svg',
    expertise: ['Recruitment & Candidate Screening', 'Social Media Management', 'Team Coordination'],
    social: { linkedin: '#LINKEDIN_URL', github: '#GITHUB_URL', instagram: '#INSTAGRAM_URL' }
  },
  {
    name: 'Team Member Name',
    role: 'UI/UX Designer',
    category: 'Member',
    bio: 'Placeholder bio — add a short summary of this person’s background and focus areas.',
    photo: '',
    expertise: ['UI/UX Design', 'Design Systems', 'Prototyping'],
    social: { linkedin: '#LINKEDIN_URL', github: '#GITHUB_URL', instagram: '#INSTAGRAM_URL' }
  },
  {
    name: 'Team Member Name',
    role: 'Cybersecurity Specialist',
    category: 'Member',
    bio: 'Placeholder bio — add a short summary of this person’s background and focus areas.',
    photo: '',
    expertise: ['Cybersecurity', 'Security Monitoring', 'Risk Assessment'],
    social: { linkedin: '#LINKEDIN_URL', github: '#GITHUB_URL', instagram: '#INSTAGRAM_URL' }
  }
];

// Expose the dataset for browser scripts as well as CommonJS tooling.
if (typeof window !== 'undefined') window.SITESENTRYLABS_TEAM = SITESENTRYLABS_TEAM;
if (typeof module !== 'undefined' && module.exports) module.exports = SITESENTRYLABS_TEAM;
