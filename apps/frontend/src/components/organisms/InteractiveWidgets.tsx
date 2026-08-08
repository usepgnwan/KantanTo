import React from 'react';
import QuizWidget from './QuizWidget';
import LearningFlowWidget from './LearningFlowWidget';
import SubjectsWidget from './SubjectsWidget';

const InteractiveWidgets: React.FC = () => {
  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8">
          
          <div className="w-full">
             <QuizWidget />
          </div>

          <div className="w-full">
             <LearningFlowWidget />
          </div>

          <div className="w-full">
             <SubjectsWidget />
          </div>

        </div>
      </div>
    </section>
  );
};

export default InteractiveWidgets;
