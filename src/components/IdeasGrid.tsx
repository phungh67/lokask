import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { ideas } from "@/data/mockData";

const IdeasGrid = () => {
  return (
    <section className="py-16 lg:py-24 bg-secondary/30">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl lg:text-4xl font-display font-bold text-foreground mb-8">
          Ideas locals often recommend
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ideas.map((idea, index) => (
            <article
              key={idea.id}
              className="card-soft p-6 flex flex-col animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <span className="tag-pill self-start mb-4">{idea.destination}</span>
              
              <h3 className="text-xl font-display font-semibold text-foreground mb-2">
                {idea.title}
              </h3>
              
              <p className="text-muted-foreground text-sm mb-6 flex-1">
                {idea.desc}
              </p>

              <Link
                to={`/explore-locals?destination=${idea.destination.toLowerCase()}`}
                className="inline-flex items-center gap-2 text-primary font-medium text-sm group"
              >
                Ask a local about this
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default IdeasGrid;
