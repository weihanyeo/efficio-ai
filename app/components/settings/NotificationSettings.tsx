import React from 'react';
import { Bell, Mail, Smartphone, Globe } from 'lucide-react';

export const NotificationSettings = () => {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6">Notification Preferences</h2>
      <div className="space-y-6 max-w-2xl">
        <div className="space-y-4">
          {[
            {
              icon: <Mail className="w-5 h-5" />,
              title: 'Email Notifications',
              description: 'Receive updates and alerts via email'
            },
            {
              icon: <Bell className="w-5 h-5" />,
              title: 'Push Notifications',
              description: 'Get instant notifications in your browser'
            },
            {
              icon: <Smartphone className="w-5 h-5" />,
              title: 'Mobile Notifications',
              description: 'Sync notifications with mobile app'
            },
            {
              icon: <Globe className="w-5 h-5" />,
              title: 'Webhook Notifications',
              description: 'Send notifications to external services'
            }
          ].map((item, index) => (
            <div key={index} className="flex items-start gap-4 p-4 bg-[#1E1E1E] rounded-lg">
              <div className="p-2 bg-[#262626] rounded-md text-indigo-400">
                {item.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="text-sm text-gray-400 mt-1">{item.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-[#363636] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4">
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};