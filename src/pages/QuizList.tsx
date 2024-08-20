import React, { useEffect, useState } from 'react';
import { IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonContent, IonPage, IonCol, IonHeader, IonToolbar, IonTitle, IonGrid, IonRow, IonButton, IonIcon } from '@ionic/react';
import { useIonRouter } from '@ionic/react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useHistory } from 'react-router-dom';
import { searchOutline } from 'ionicons/icons';

const LoadingDots: React.FC = () => (
  <div className="loading-dots">
    <div className="dot"></div>
    <div className="dot"></div>
    <div className="dot"></div>
  </div>
);

const QuizList: React.FC = () => {
  const history = useHistory();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredQuizzes, setFilteredQuizzes] = useState<any[]>([]);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const quizCollection = collection(db, 'quizzes');
        const quizSnapshot = await getDocs(quizCollection);
        const quizList = quizSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setQuizzes(quizList);
        setFilteredQuizzes(quizList);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching quizzes:', error);
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

  const handleSearchClick = () => {
    const filtered = quizzes.filter(quiz =>
      quiz.topic.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredQuizzes(filtered);
  };

  const handleQuizClick = (quizId: string) => {
    history.push(`/quiz/${quizId}`);
  };

  return (
    <IonPage>
      <IonHeader >
        <IonToolbar className="custom-toolbar">
          <IonTitle className="custom-title">Choose A Quiz</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div className="search-bar-container">
          
          <div className="custom-searchbar">
            <input
              type="text"
              placeholder="Search for a quiz"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <IonButton onClick={handleSearchClick}>
              <IonIcon icon={searchOutline} />
            </IonButton>
          </div>
        </div>

        <IonGrid className="quiz-grid">
          <IonRow>
            {loading ? (
              <IonCol size="12" className="loading-col">
                <LoadingDots />
              </IonCol>
            ) : (
              filteredQuizzes.length === 0 ? (
                <IonCol size="12">
                  <p>No quizzes found.</p>
                </IonCol>
              ) : (
                filteredQuizzes.map((quiz, index) => (
                  <IonCol size="6" key={index} className="quiz-col">
                    <IonCard className="quiz-card" onClick={() => handleQuizClick(quiz.id)}>
                      <IonCardHeader>
                        <IonCardTitle>{quiz.topic}</IonCardTitle>
                      </IonCardHeader>
                      <IonCardContent>
                        {`Total Points: ${quiz.totalPoints}`}
                      </IonCardContent>
                    </IonCard>
                  </IonCol>
                ))
              )
            )}
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default QuizList;
