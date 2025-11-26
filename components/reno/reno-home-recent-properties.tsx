"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Property } from "@/lib/property-storage";
import { useI18n } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { Building2, User } from "lucide-react";

interface RenoHomeRecentPropertiesProps {
  properties: Property[];
  propertiesByPhase?: Record<string, Property[]>;
}

export function RenoHomeRecentProperties({ properties, propertiesByPhase }: RenoHomeRecentPropertiesProps) {
  const { t, language } = useI18n();
  const router = useRouter();

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

  // Group by renovator name
  const worksByRenovator = useMemo(() => {
    const grouped: Record<string, Property[]> = {};
    
    activeWorks.forEach(property => {
      const renovatorName = property.renovador || 'Sin renovator';
      if (!grouped[renovatorName]) {
        grouped[renovatorName] = [];
      }
      grouped[renovatorName].push(property);
    });
    
    // Sort renovators by count (most works first)
    return Object.entries(grouped)
      .sort(([, a], [, b]) => b.length - a.length)
      .slice(0, 10); // Show top 10 renovators
  }, [activeWorks]);

  const handlePropertyClick = (property: Property) => {
    router.push(`/reno/construction-manager/property/${property.id}`);
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
        <div className="space-y-4">
          {worksByRenovator.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t.messages.notFound}
            </p>
          ) : (
            worksByRenovator.map(([renovatorName, properties]) => (
              <div
                key={renovatorName}
                className="rounded-lg border border-border p-4 hover:bg-[var(--prophero-gray-50)] dark:hover:bg-[var(--prophero-gray-800)] transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-semibold text-foreground">
                      {renovatorName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      {properties.length} {properties.length === 1 ? (language === 'es' ? 'obra' : 'work') : (language === 'es' ? 'obras' : 'works')}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  {properties.slice(0, 3).map((property) => (
                    <div
                      key={property.id}
                      onClick={() => handlePropertyClick(property)}
                      className="flex items-start justify-between p-2 rounded-md border border-border/50 hover:bg-[var(--prophero-gray-100)] dark:hover:bg-[var(--prophero-gray-700)] cursor-pointer transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">
                          {property.address || property.fullAddress}
                        </p>
                        {property.renoPhase && (
                          <span className="text-xs text-muted-foreground mt-0.5 block">
                            {property.renoPhase}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {properties.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center pt-1">
                      +{properties.length - 3} {language === 'es' ? 'más' : 'more'}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}






