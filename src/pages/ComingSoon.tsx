import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Sparkles, ArrowLeft } from "lucide-react";

interface ComingSoonProps {
  title: string;
  description: string;
}

const ComingSoon = ({ title, description }: ComingSoonProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <Card className="max-w-2xl w-full p-12 bg-gradient-card border-border text-center">
        <div className="w-20 h-20 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-10 h-10 text-primary-foreground" />
        </div>
        <h1 className="text-4xl font-bold mb-4 text-foreground">{title}</h1>
        <p className="text-xl text-muted-foreground mb-8">{description}</p>
        <p className="text-muted-foreground mb-8">
          This feature is coming soon! We're working hard to bring you the best AI-powered development tools.
        </p>
        <Button asChild className="bg-gradient-primary hover:opacity-90">
          <Link to="/dashboard">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </Card>
    </div>
  );
};

export default ComingSoon;
