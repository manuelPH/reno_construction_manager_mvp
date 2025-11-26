"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Property } from "@/lib/property-storage";
import { useI18n } from "@/lib/i18n";
import { useMemo } from "react";
import { Trophy, Medal, Award } from "lucide-react";

interface RenoHomeRecentPropertiesProps {
  properties: Property[];
  propertiesByPhase?: Record<string, Property[]>;
}

export function RenoHomeRecentProperties({ properties, propertiesByPhase }: RenoHomeRecentPropertiesProps) {
  const { t, language } = useI18n();

  // Filter active works: from reno-in-progress to final-check
  const activeWorks = useMemo(() => {
    if (!propertiesByPhase) return [];
    
    const activePhases = ['reno-in-progress', 'furnishing-cleaning', 'final-check'];
    const activeProperties: Property[] = [];
    
    activePhases.forEach(phase => {
      const phaseProperties = propertiesByPhase[phase] || [];
      activeProperties.push(...phaseProperties);
    });
    
    return activeProperties;
  }, [propertiesByPhase]);

  // Group by renovator name and create ranking
  const ranking = useMemo(() => {
    const grouped: Record<string, Property[]> = {};
    
    activeWorks.forEach(property => {
      const renovatorName = property.renovador || (language === 'es' ? 'Sin renovator' : 'No renovator');
      if (!grouped[renovatorName]) {
        grouped[renovatorName] = [];
      }
      grouped[renovatorName].push(property);
    });
    
    // Sort renovators by count (most works first) and add ranking position
    return Object.entries(grouped)
      .sort(([, a], [, b]) => b.length - a.length)
      .map(([renovatorName, properties], index) => ({
        position: index + 1,
        renovatorName,
        count: properties.length,
      }));
  }, [activeWorks, language]);

  const getRankIcon = (position: number) => {
    if (position === 1) return <Trophy className="h-4 w-4 text-yellow-500" />;
    if (position === 2) return <Medal className="h-4 w-4 text-gray-400" />;
    if (position === 3) return <Award className="h-4 w-4 text-amber-600" />;
    return null;
  };

  return (
    <Card className="bg-card dark:bg-[var(--prophero-gray-900)]">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{t.dashboard.activeWorksByRenovator}</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          {t.dashboard.activeWorksByRenovatorDescription}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {ranking.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t.messages.notFound}
            </p>
          ) : (
            ranking.map((item) => (
              <div
                key={item.renovatorName}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-[var(--prophero-gray-50)] dark:hover:bg-[var(--prophero-gray-800)] transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Ranking position */}
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--prophero-gray-100)] dark:bg-[var(--prophero-gray-800)] flex-shrink-0">
                    {getRankIcon(item.position) || (
                      <span className="text-xs font-semibold text-muted-foreground">
                        {item.position}
                      </span>
                    )}
                  </div>
                  
                  {/* Renovator name */}
                  <p className="text-sm font-medium text-foreground truncate flex-1">
                    {item.renovatorName}
                  </p>
                </div>
                
                {/* Count */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="text-lg font-bold text-foreground">
                    {item.count}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {item.count === 1 ? (language === 'es' ? 'obra' : 'work') : (language === 'es' ? 'obras' : 'works')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}






