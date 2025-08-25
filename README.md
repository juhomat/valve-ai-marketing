# Valve's AI Marketing

A modern web application for AI-powered marketing automation, designed specifically for pilot customers. This application provides a comprehensive suite of marketing tools following Valve.fi's clean and professional design aesthetic.

## Features

The application includes 10 core marketing functionalities:

1. **Analysis from data & insight** - Extract valuable insights from customer data
2. **Defining the target segments** - Identify and define specific customer segments
3. **Defining targets and KPI's** - Set measurable goals and performance indicators
4. **Developing marketing campaigns** - Create compelling marketing campaigns
5. **Executing marketing campaigns** - Launch and manage campaigns across channels
6. **Gathering leads & prospects** - Capture and organize high-quality leads
7. **Developing sales activities** - Design effective sales strategies
8. **Executing sales activities** - Implement sales activities and track progress
9. **Signing deals (eventually)** - Close deals and convert prospects
10. **Measuring every phase** - Monitor and analyze performance across all phases

## Technology Stack

- **Backend**: Node.js with Express.js
- **Frontend**: Pure HTML5, CSS3, and JavaScript (ES6+)
- **Styling**: Custom CSS following Valve.fi design patterns
- **Icons**: Font Awesome 6
- **Fonts**: Inter (Google Fonts)

## Installation

1. Clone the repository or extract the files
2. Navigate to the project directory
3. Install dependencies:
   ```bash
   npm install
   ```

## Usage

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The application will be available at `http://localhost:3000`

## Project Structure

```
Valve AI Prototype/
├── server.js              # Express.js server configuration
├── package.json            # Node.js dependencies and scripts
├── README.md              # Project documentation
├── views/
│   └── index.html         # Main HTML template
└── public/
    ├── css/
    │   └── styles.css     # Main stylesheet
    ├── js/
    │   └── app.js         # Client-side JavaScript
    └── images/            # Static images (empty for now)
```

## Design System

The application follows Valve.fi's design principles:

- **Color Palette**: Clean whites with blue accents (#2563eb primary)
- **Typography**: Inter font family for modern readability
- **Layout**: Spacious design with ample white space
- **Components**: Card-based layout with subtle shadows and hover effects
- **Responsive**: Mobile-first design with breakpoints at 768px and 480px

## Features in Detail

### Navigation
- Sticky header with navigation menu
- Active state management
- User profile section

### Hero Section
- Compelling headline and description
- Animated visual element
- Gradient backgrounds

### Function Cards
- Interactive hover effects
- Icon-based visual hierarchy
- Call-to-action buttons
- Loading states and feedback

### Statistics Section
- Animated counters on scroll
- Key performance metrics
- Professional data presentation

### Footer
- Company information and links
- Responsive grid layout
- Professional styling

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

This is a prototype application. For production use, consider adding:

- Backend API integration
- Database connectivity
- User authentication
- Real-time data updates
- Comprehensive error handling
- Unit and integration tests

## License

MIT License - see package.json for details
# valve-ai-marketing
