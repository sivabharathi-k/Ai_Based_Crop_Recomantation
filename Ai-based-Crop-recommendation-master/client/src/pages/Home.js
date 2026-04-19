import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  TrendingUp,
  Globe,
  Shield,
  Zap,
  Star
} from 'lucide-react';

const Home = () => {
  const features = [
    {
      icon: BarChart3,
      title: 'AI-Powered Crop Prediction',
      description: 'Get intelligent crop recommendations based on soil conditions, weather data, and market trends using advanced machine learning algorithms.',
      color: 'text-primary-600'
    },
    {
      icon: TrendingUp,
      title: 'Market Intelligence',
      description: 'Access real-time market prices, demand forecasts, and profit potential analysis for informed decision making.',
      color: 'text-accent-600'
    },
    {
      icon: Globe,
      title: 'Multi-Language Support',
      description: 'Available in 10+ local languages with voice-to-text and text-to-speech capabilities for better accessibility.',
      color: 'text-purple-600'
    },
    {
      icon: Shield,
      title: 'Data Security',
      description: 'Your farm data is encrypted and stored securely with enterprise-grade security measures.',
      color: 'text-green-600'
    },
    {
      icon: Zap,
      title: 'Real-Time Insights',
      description: 'Get instant recommendations and alerts based on current weather conditions and market trends.',
      color: 'text-orange-600'
    }
  ];

  const testimonials = [
    {
      name: 'Rajesh Kumar',
      role: 'Farmer, Punjab',
      content: 'CropAI has revolutionized my farming. The predictions are accurate and the market insights help me maximize profits.',
      rating: 5
    },
    {
      name: 'Priya Sharma',
      role: 'Agricultural Advisor, Maharashtra',
      content: 'The AI crop prediction is incredibly accurate. I can quickly provide better recommendations to farmers.',
      rating: 5
    },
    {
      name: 'Amit Patel',
      role: 'Farm Owner, Gujarat',
      content: 'The multi-language support makes it easy for my workers to understand recommendations in their local language.',
      rating: 5
    }
  ];

  const stats = [
    { number: '10,000+', label: 'Active Farmers' },
    { number: '95%', label: 'Prediction Accuracy' },
    { number: '50+', label: 'Crop Types Supported' },
    { number: '10+', label: 'Languages Available' }
  ];

  const footerLinks = {
    Support: ['Documentation', 'Help Center', 'Contact Us'],
    Company: ['About', 'Privacy', 'Terms']
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <div className="absolute inset-0 bg-grid opacity-5" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                <span className="gradient-text">Intelligent Crop</span>
                <br />
                Recommendation Platform
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
                Harness the power of AI and machine learning to optimize your farming decisions.
                Get personalized crop recommendations, disease detection, and market insights in your local language.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <Link to="/register" className="btn-primary btn-lg group">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link to="/login" className="btn-secondary btn-lg">Sign In</Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-16 grid grid-cols-2 gap-8 sm:grid-cols-4"
            >
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-bold text-primary-600">{stat.number}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Everything you need for smart farming</h2>
            <p className="mt-4 text-lg text-gray-600">Our platform combines cutting-edge technology with agricultural expertise</p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="card hover:shadow-medium transition-shadow duration-300"
                >
                  <div className="card-body">
                    <div className={`inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 ${feature.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-gray-900">{feature.title}</h3>
                    <p className="mt-2 text-gray-600">{feature.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">How it works</h2>
            <p className="mt-4 text-lg text-gray-600">Get started in three simple steps</p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {[
              { step: '01', title: 'Input Your Data', description: 'Enter soil conditions, weather data, and location information' },
              { step: '02', title: 'AI Analysis', description: 'Our ML models analyze your data and market conditions' },
              { step: '03', title: 'Get Recommendations', description: 'Receive personalized crop suggestions with confidence scores' }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="text-center"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-2xl font-bold text-primary-600">
                  {item.step}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-gray-600">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">What farmers are saying</h2>
            <p className="mt-4 text-lg text-gray-600">Join thousands of satisfied farmers who trust CropAI</p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="card"
              >
                <div className="card-body">
                  <div className="flex items-center space-x-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="mt-4 text-gray-600">"{testimonial.content}"</p>
                  <div className="mt-4">
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary-600">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Ready to transform your farming?</h2>
          <p className="mt-4 text-lg text-primary-100">Join thousands of farmers who are already using AI to optimize their crops</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/register" className="btn bg-white text-primary-600 hover:bg-gray-50 btn-lg">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link to="/login" className="btn border-white text-white hover:bg-white hover:text-primary-600 btn-lg">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center">
                <div className="text-2xl">🌱</div>
                <span className="ml-2 text-xl font-bold text-white">CropAI</span>
              </div>
              <p className="mt-4 text-gray-400">Intelligent crop recommendation platform for modern farming.</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white">Product</h3>
              <ul className="mt-4 space-y-2">
                <li><Link to="/prediction" className="text-gray-400 hover:text-white">Crop Prediction</Link></li>
                <li><Link to="/market" className="text-gray-400 hover:text-white">Market Intelligence</Link></li>
              </ul>
            </div>

            {/* Replaced href="#" with buttons in footer */}
            {Object.entries(footerLinks).map(([section, links]) => (
              <div key={section}>
                <h3 className="text-sm font-semibold text-white">{section}</h3>
                <ul className="mt-4 space-y-2">
                  {links.map((link) => (
                    <li key={link}>
                      <button
                        type="button"
                        className="text-gray-400 hover:text-white text-sm"
                        onClick={() => alert(`${link} page coming soon.`)}
                      >
                        {link}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-8 border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400">© 2024 CropAI. All rights reserved. Built for SIH Hackathon.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
