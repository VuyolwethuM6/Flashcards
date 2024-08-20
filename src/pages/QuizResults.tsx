import React from 'react';
import { IonPage, IonContent, IonHeader, IonToolbar, IonTitle, IonText } from '@ionic/react';
import { useLocation, useHistory } from 'react-router-dom';
import './QuizResults.css';

const QuizResults: React.FC = () => {
  const location = useLocation();
  const history = useHistory();
  const { score, totalPoints } = location.state as { score: number, totalPoints: number };

  const handleBackToQuizList = () => {
    history.push('/quiz');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle className="custom-title">Quiz Results</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="results-container">
          <IonText>
            <h2>Your Score</h2>
            <p>{score} / {totalPoints}</p>
            <h3>Well done!</h3>
          </IonText>
        </div>
        
        <div className="center-button">
          <button className="custom-button" onClick={handleBackToQuizList}>
            Back to Quiz List
          </button>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default QuizResults;
