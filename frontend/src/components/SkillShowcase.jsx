import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function SkillShowcase() {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchFeed() {
            try {
                const res = await axios.get('http://localhost:5000/api/user/demo-videos/feed');
                setVideos(res.data || []);
            } catch (err) {
                console.error('Failed to load video feed', err);
            } finally {
                setLoading(false);
            }
        }
        fetchFeed();
    }, []);

    if (loading) return <div className="py-10 text-center">Loading showcase...</div>;
    if (videos.length === 0) return null; // Don't show if empty

    return (
        <section className="py-24 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 mb-12 text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-4xl font-heading font-bold text-gray-900 mb-4">Live from the Community</h2>
                    <p className="text-xl text-gray-500">Watch short skills demos from top mentors.</p>
                </motion.div>
            </div>

            <div className="relative z-10">
                {/* Horizontal Scroll Container */}
                <div className="flex overflow-x-auto gap-8 px-8 pb-12 snap-x snap-mandatory scrollbar-hide" style={{ scrollBehavior: 'smooth' }}>
                    {videos.map((item, idx) => (
                        <motion.div
                            key={`${item.userId}-${idx}`}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1, type: "spring", stiffness: 100 }}
                            className="flex-shrink-0 w-80 h-[500px] bg-gray-900 rounded-3xl overflow-hidden shadow-2xl relative snap-center group border-[4px] border-white/20"
                        >
                            {/* Video */}
                            <video
                                src={item.video.url}
                                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500 scale-105 group-hover:scale-100 transform"
                                controls={false}
                                muted
                                loop
                                onMouseEnter={(e) => e.target.play()}
                                onMouseLeave={(e) => e.target.pause()}
                                poster={item.video.url.replace(/\.[^/.]+$/, ".jpg")}
                            />

                            {/* Overlay Content */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                <h3 className="font-bold text-xl text-white mb-1 line-clamp-2">{item.video.title}</h3>

                                <div className="flex items-center gap-3 my-4">
                                    <img src={item.avatarUrl || 'https://via.placeholder.com/40'} className="w-10 h-10 rounded-full border-2 border-white/80" alt={item.name} />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-white/90 truncate max-w-[150px]">{item.name}</span>
                                        <span className="text-xs text-white/60">Mentor</span>
                                    </div>
                                </div>

                                <Link
                                    to={`/mentor/${item.userId}`}
                                    className="w-full py-3 bg-white/10 hover:bg-white text-white hover:text-indigo-900 backdrop-blur-md rounded-xl text-sm font-bold transition-all duration-300 text-center border border-white/20"
                                >
                                    Book Session
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
