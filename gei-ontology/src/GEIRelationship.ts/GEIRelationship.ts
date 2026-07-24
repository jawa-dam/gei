export interface GEIRelationship {
  from: string;
  to: string;
  type:
    | 'observes'
    | 'generates'
    | 'initiates'
    | 'produces'
    | 'supports'
    | 'guides';
}