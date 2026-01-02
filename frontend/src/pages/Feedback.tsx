import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Heart, CheckCircle, AlertCircle } from 'lucide-react';
import StarRating from '@/components/shared/StarRating';
import { useToast } from '@/hooks/use-toast';
import { requestsApi, feedbackApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const Feedback = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role } = useAuth();

  const [request, setRequest] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [conditionMatched, setConditionMatched] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequest = async () => {
      if (!requestId) return;
      try {
        setLoading(true);
        const data = await requestsApi.getById(requestId);
        setRequest(data);
      } catch (error) {
        console.error("Failed to load request", error);
        toast({
          title: "Error",
          description: "Could not load request details",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    fetchRequest();
  }, [requestId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast({
        title: "Please rate your experience",
        variant: "destructive",
      });
      return;
    }

    if (!request) return;

    try {
      // Determine target user (usually donor, but could be requester if donor is giving feedback?)
      // For now assume feedback is for the other party.
      // But typically this page is reached after "Complete" in RequestStatus, which is often by Requester (Student).
      // If NGO is donor, Student rates NGO.
      // If Student is requester, they rate Donor.

      const targetUid = request.donor_uid; // Assuming we rate the donor (who gave the book)

      await feedbackApi.submit(targetUid, {
        rating,
        comment: feedback,
        condition_matched: conditionMatched,
        request_id: requestId,
        book_id: request.book_id
      });

      setSubmitted(true);
      toast({
        title: "Thank you for your feedback!",
        description: "Your feedback helps improve EduCycle for everyone.",
      });
    } catch (error: any) {
      toast({
        title: "Error submitting feedback",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header userType={role || "student"} />
        <main className="flex-1 container py-8">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6 animate-bounce-soft">
              <Heart className="h-10 w-10 text-success fill-success" />
            </div>
            <h1 className="text-3xl font-display font-bold mb-4">Thank You!</h1>
            <p className="text-muted-foreground mb-8">
              Your feedback helps us build a better community.
              You've earned <strong className="text-primary">25 EduCredits</strong> for sharing your experience!
            </p>

            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigate('/student-impact')}>
                View My Impact
              </Button>
              <Button variant="outline" onClick={() => navigate('/search-books')}>
                Find More Books
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header userType={role || "student"} />

      <main className="flex-1 container py-8">
        <Link to="/request-status" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to requests
        </Link>

        <div className="max-w-lg mx-auto">
          <h1 className="text-3xl font-display font-bold mb-2">Share Your Experience</h1>
          <p className="text-muted-foreground mb-8">
            Help others by rating your book exchange experience
          </p>

          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Book Info */}
              <Card variant="outlined">
                <CardContent className="p-4">
                  <h3 className="font-display font-bold">{request?.book_title || 'Book Exchange'}</h3>
                  <p className="text-sm text-muted-foreground">
                    Donor: {request?.donor_name || 'Anonymous'}
                  </p>
                </CardContent>
              </Card>

              {/* Condition Check */}
              <Card>
                <CardContent className="p-4 flex items-start gap-3 pt-6">
                  <Checkbox
                    id="condition"
                    checked={conditionMatched}
                    onCheckedChange={(c) => setConditionMatched(c as boolean)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="condition"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Book condition matched description
                    </label>
                    <p className="text-sm text-muted-foreground">
                      Was the book in the condition shown in photos?
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Rating */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">How was your experience?</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <StarRating rating={rating} onRatingChange={setRating} size="lg" />
                </CardContent>
              </Card>

              {/* Feedback Text */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Any comments? (Optional)</CardTitle>
                </CardHeader>
                <CardContent>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Share what went well or what could be improved..."
                    className="w-full h-24 px-4 py-3 rounded-lg border-2 border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary resize-none"
                  />
                </CardContent>
              </Card>

              <Button type="submit" size="lg" className="w-full">
                Submit Feedback
              </Button>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Feedback;
