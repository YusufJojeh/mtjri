import React from 'react';
import PlanForm, { type Plan } from './form';

interface Props {
  plan: Plan;
  otherDefaultPlanExists: boolean;
}

export default function EditPlan({ plan, otherDefaultPlanExists }: Props) {
  return <PlanForm plan={plan} otherDefaultPlanExists={otherDefaultPlanExists} />;
}