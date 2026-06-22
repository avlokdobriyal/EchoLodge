"use client";
import { useState } from "react";
import { Button, Input, Modal, Loader, notify } from "../../components/ui";

export default function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const simulateLoading = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      notify("Action completed successfully!", "success");
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100 mb-8 border-b pb-4 dark:border-slate-800">
        UI Components Showcase
      </h1>
      
      <div className="space-y-12">
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200">Buttons</h2>
          <div className="flex flex-wrap gap-4 items-center">
            <Button variant="primary" size="md">Primary</Button>
            <Button variant="secondary" size="md">Secondary</Button>
            <Button variant="outline" size="md">Outline</Button>
            <Button variant="primary" size="sm">Small</Button>
            <Button variant="primary" size="lg">Large</Button>
            <Button variant="primary" disabled>Disabled</Button>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200">Inputs</h2>
          <div className="max-w-md space-y-4">
            <Input 
              label="Standard Input" 
              placeholder="Enter some text..." 
              value={inputValue} 
              onChange={(e) => setInputValue(e.target.value)} 
            />
            <Input 
              label="Error State Input" 
              placeholder="Validation failed" 
              value="Invalid email" 
              onChange={() => {}} 
              error="Please enter a valid email address." 
            />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200">Modal</h2>
          <Button variant="secondary" onClick={() => setIsModalOpen(true)}>
            Open Demo Modal
          </Button>

          <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Sample Modal">
            <div className="space-y-4 text-slate-600 dark:text-slate-300">
              <p>This is a demonstration of the accessible modal component. It traps focus and can be closed with the Escape key or the close button.</p>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button variant="primary" onClick={() => {
                  setIsModalOpen(false);
                  notify("Modal action confirmed", "success");
                }}>Confirm Actions</Button>
              </div>
            </div>
          </Modal>
        </section>

        <section className="space-y-4 pb-20">
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200">Loader & Notifications</h2>
          <div className="flex flex-wrap gap-4 items-center">
            <Button variant="primary" onClick={simulateLoading} disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader className="w-4 h-4" /> Processing...
                </span>
              ) : (
                "Trigger Loading & Toast"
              )}
            </Button>
            <Button variant="outline" onClick={() => notify("This is a simple blank toast!", "blank")}>
              Blank Toast
            </Button>
            <Button variant="secondary" onClick={() => notify("An error occurred!", "error")}>
              Error Toast
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
