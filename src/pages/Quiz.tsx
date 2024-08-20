import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import {
  IonPage,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonRadioGroup,
  IonRadio,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonSpinner,
  IonAlert,
} from '@ionic/react';
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  increment,
  addDoc,
  collection,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { CSSTransition, SwitchTransition } from 'react-transition-group';
import { db } from '../firebaseConfig';
import { arrowBack, arrowForward } from 'ionicons/icons';

interface QuizData {
  topic: string;
  questions: Question[];
  totalPoints: number;
}

interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
  points?: number;
}

interface UserResult {
  quizId: string;
  userId: string;
  answers: { [key: string]: string };
  score: number;
  submittedAt: Date;
}

const QuizPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [error, setError] = useState<string | null>(null);
  const history = useHistory();

  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        const quizDoc = doc(db, 'quizzes', quizId);
        const quizSnapshot = await getDoc(quizDoc);

        if (quizSnapshot.exists()) {
          const quiz = quizSnapshot.data() as QuizData;
          const questions = await Promise.all(
            quiz.questions.map(async (questionRef: any) => {
              const questionDoc = await getDoc(questionRef);
              return questionDoc.data() as Question;
            })
          );
          setQuizData({ ...quiz, questions });
        } else {
          setError('Quiz not found.');
        }
      } catch (error) {
        console.error('Error fetching quiz data:', error);
        setError('Failed to load quiz data. Please try again.');
      }
    };

    fetchQuizData();
  }, [quizId]);

  const handleAnswerChange = useCallback(
    (questionIndex: number, answer: string) => {
      setAnswers((prevAnswers) => ({
        ...prevAnswers,
        [questionIndex]: answer,
      }));
    },
    []
  );

  const handleNext = useCallback(() => {
    setDirection('next');
    if (quizData && currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  }, [currentQuestionIndex, quizData]);

  const handlePrev = useCallback(() => {
    setDirection('prev');
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  }, [currentQuestionIndex]);

  const calculateScore = useCallback(() => {
    if (!quizData) return 0;
    return quizData.questions.reduce((score, question, index) => {
      if (answers[index] === question.correctAnswer) {
        return score + (question.points || 1); // Default to 1 point per question if no points field
      }
      return score;
    }, 0);
  }, [answers, quizData]);

  const handleSubmit = useCallback(async () => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error('No user is currently logged in.');
      }

      const userId = currentUser.uid;
      const score = calculateScore();

      const resultData: UserResult = {
        quizId,
        userId,
        answers,
        score,
        submittedAt: new Date(),
      };
      await addDoc(collection(db, 'quizResults'), resultData);
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        points: increment(score),
        quizHistory: arrayUnion({
          quizId,
          score,
          submittedAt: new Date(),
        }),
      });

      // Navigate to the results page
      history.push(`/quiz/${quizId}/results`, { score, totalPoints: quizData?.totalPoints });
    } catch (error) {
      console.error('Error submitting quiz:', error);
      setError('Failed to submit quiz. Please try again.');
    }
  }, [calculateScore, quizId, answers, history, quizData]);

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar className="custom-toolbar">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/quiz" icon={arrowBack} text="" className="custom-back-button" />
          </IonButtons>
          <IonTitle className="custom-title">{quizData?.topic || 'Quiz'}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {error && (
          <IonAlert
            isOpen={!!error}
            onDidDismiss={() => setError(null)}
            header="Error"
            message={error}
            buttons={['OK']}
          />
        )}
        {quizData ? (
          <>
            <SwitchTransition mode="out-in">
              <CSSTransition
                key={currentQuestionIndex}
                addEndListener={(node, done) => {
                  node.addEventListener("transitionend", done, false);
                }}
                classNames={direction}
              >
                <IonCard>
                  <IonCardHeader>
                    <IonCardTitle>{quizData.questions[currentQuestionIndex]?.question}</IonCardTitle>
                  </IonCardHeader>
                  <IonRadioGroup value={answers[currentQuestionIndex]} onIonChange={e => handleAnswerChange(currentQuestionIndex, e.detail.value)}>
                    {quizData.questions[currentQuestionIndex]?.options.map((option: string, optIndex: number) => (
                      <IonItem key={optIndex}>
                        <IonLabel>{option}</IonLabel>
                        <IonRadio slot="start" value={option} />
                      </IonItem>
                    ))}
                  </IonRadioGroup>
                </IonCard>
              </CSSTransition>
            </SwitchTransition>

            <div className="navigation-buttons">
              <IonButton fill="clear" onClick={handlePrev} disabled={currentQuestionIndex === 0}>
                <IonIcon icon={arrowForward} style={{ transform: 'rotate(180deg)' }} />
                Prev
              </IonButton>
              {currentQuestionIndex === quizData.questions.length - 1 ? (
                <IonButton onClick={handleSubmit}>Submit Quiz</IonButton>
              ) : (
                <IonButton onClick={handleNext}>
                  Next
                  <IonIcon slot="end" icon={arrowForward} />
                </IonButton>
              )}
            </div>
          </>
        ) : (
          <div className="loading-container">
            <IonSpinner name="crescent" />
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default QuizPage;
     