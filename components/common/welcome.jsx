"use client";

import { motion } from "framer-motion";
import {
  GraduationCap,
  Calendar,
  Users,
  BookOpen,
  Target,
  MessageCircle,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WelcomeToLead() {
  const features = [
    {
      icon: Target,
      title: "Deep Dedication",
      description: "A call to action for genuine commitment to discipleship",
    },
    {
      icon: BookOpen,
      title: "52-Week Journey",
      description:
        "Comprehensive curriculum with weekly materials and assessments",
    },
    {
      icon: Calendar,
      title: "Hybrid Learning",
      description: "Self-paced weekday study with Sunday review sessions",
    },
    {
      icon: GraduationCap,
      title: "Project-Based",
      description: "Capstone project assigned 6 months before graduation",
    },
  ];

  const commitments = [
    "Attend class regularly and inform authorities of any absences",
    "Maintain exemplary character throughout the program",
    "Engage actively with weekly materials before Sunday reviews",
    "Complete weekly assessments and examinations",
    "Ask questions freely when concepts are unclear",
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] overflow-auto">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0d12] via-[#11151c] to-[#145a32] dark:opacity-100 opacity-0" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#f5f7fa] via-[#ffffff] to-[#ecfdf5] dark:opacity-0 opacity-100" />

        {/* Animated Glow Effect */}
        <motion.div
          className="absolute top-0 right-0 w-96 h-96 bg-[var(--color-green-primary)] rounded-full blur-[128px] opacity-20"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <div className="relative max-w-6xl mx-auto px-4 py-20 sm:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* Success Badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-green-primary)]/10 border border-[var(--color-green-primary)]/20 mb-6"
            >
              <CheckCircle2 className="w-5 h-5 text-[var(--color-green-primary)]" />
              <span className="text-sm font-medium text-[var(--color-green-primary)]">
                Registration Successful
              </span>
            </motion.div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-[var(--text-primary)] mb-6 font-[family-name:var(--font-serif)]">
              Welcome to{" "}
              <span className="text-[var(--color-green-primary)]">LEAD</span>
            </h1>

            <p className="text-xl sm:text-2xl text-white-primary mb-4 max-w-3xl mx-auto">
              Leadership Earned After Discipleship
            </p>

            <p className="text-lg text-white-primary mb-12 max-w-2xl mx-auto italic">
              Making Disciples of Jesus, Our First Priority
            </p>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Button
                asChild
                className="group bg-green-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                <a
                  href="https://t.me/+tdjVaX9enhQ0OWU0"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Join Our Telegram Community
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              className="group bg-[var(--surface)] rounded-2xl border border-[var(--border-color)] p-6 hover:border-[var(--color-green-primary)]/30 transition-all shadow-[var(--shadow-md)]"
            >
              <div className="w-12 h-12 rounded-xl bg-[var(--color-green-primary)]/10 flex items-center justify-center mb-4 group-hover:bg-[var(--color-green-primary)]/20 transition-colors">
                <feature.icon className="w-6 h-6 text-[var(--color-green-primary)]" />
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Program Details */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Aims & Objectives */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-[var(--surface)] rounded-2xl border border-[var(--border-color)] p-8 shadow-[var(--shadow-lg)]"
          >
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">
              Program Mission
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-green-primary)] mb-2">
                  A Call to Action
                </h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  This marks the start of a serious endeavor where participants
                  demonstrate deep dedication, loyalty, and adherence to
                  biblical truth.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[var(--color-green-primary)] mb-2">
                  A Moment of Truth
                </h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  A time when only the most genuinely committed followers
                  emerge, often following a period of testing or uncertainty.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[var(--color-green-primary)] mb-2">
                  Transformation Point
                </h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  Until the nature of disciples is formed in you, leadership can
                  be a disaster. This program cultivates deeply dedicated
                  disciples who fully embody Christ's mission.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Schedule & Commitments */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 }}
            className="space-y-6"
          >
            {/* Class Schedule */}
            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-color)] p-8 shadow-[var(--shadow-lg)]">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">
                Class Schedule
              </h2>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[var(--color-green-primary)]/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-6 h-6 text-[var(--color-green-primary)]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[var(--text-primary)] mb-1">
                      Weekly Materials
                    </h4>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Video & document materials released every Monday. Study at
                      your own pace before Sunday review.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[var(--color-green-primary)]/10 flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-[var(--color-green-primary)]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[var(--text-primary)] mb-1">
                      Sunday Review (Hybrid)
                    </h4>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Weekly review sessions followed by assessments every
                      Sunday.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[var(--color-green-primary)]/10 flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-6 h-6 text-[var(--color-green-primary)]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[var(--text-primary)] mb-1">
                      Project Work
                    </h4>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Topic released 6 months before graduation
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Commitments */}
            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-color)] p-8 shadow-[var(--shadow-lg)]">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">
                Your Commitments
              </h2>

              <ul className="space-y-3">
                {commitments.map((commitment, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1 + index * 0.1 }}
                    className="flex gap-3 items-start"
                  >
                    <CheckCircle2 className="w-5 h-5 text-[var(--color-green-primary)] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-[var(--text-secondary)]">
                      {commitment}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-6xl mx-auto px-4 py-16 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="bg-green-800 rounded-2xl p-12 text-center"
        >
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Begin Your Journey?
          </h2>
          <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of disciples in our Telegram community. Get updates,
            connect with fellow students, and access exclusive resources.
          </p>
          <Button
            asChild
            className="bg-white text-black-base hover:bg-white/90 px-8 py-6 text-lg rounded-xl shadow-lg"
          >
            <a
              href="https://t.me/+tdjVaX9enhQ0OWU0"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              Join Telegram Community Now
              <ArrowRight className="w-5 h-5" />
            </a>
          </Button>
        </motion.div>
      </section>
    </div>
  );
}
