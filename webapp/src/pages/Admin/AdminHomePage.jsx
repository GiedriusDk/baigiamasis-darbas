import { useState } from "react";
import { Title, Text, Tabs, Box } from "@mantine/core";

import AdminUsersSection from "./AdminUsersSection";
import AdminProfilesSection from "./UserProfile/AdminProfilesSection";
import AdminCoachProfilesSection from "./CoachProfile/AdminCoachProfilesSection";
import AdminCoachExercisesSection from "./CoachExercises/AdminCoachExercisesSection";
import AdminChatRoomsSection from "./ChatRooms/AdminChatRoomsSection";
import AdminChatMessagesSection from "./ChatMessages/AdminChatMessagesSection";
import AdminOrdersSection from "./PaymentOrders/AdminOrdersSection";
import AdminProductsSection from "./PaymentProduct/AdminProductsSection";
import AdminPlansSection from "./CoachPlans/AdminPlansSection";
import AdminProgressGoalsSection from "./ProggressGoal/AdminProgressGoalsSection";
import AdminProgressEntriesSection from "./ProgressEntries/AdminProgressEntriesSection";
import AdminSplitsSection from "./PlannerSplit/AdminSplitsSection";
import AdminPlannerWorkoutsSection from "./PlannerWorkout/AdminWorkoutsSection";
import AdminExercisesSection from "./Catalog/AdminExercisesSection";

export default function AdminHomePage() {
  const [tab, setTab] = useState("users");

  return (
    <Box>
      <Title order={2}>Admin panel</Title>
      <Text c="dimmed" mt="sm">
        Čia gali matyti ir valdyti vartotojus, profilius, trenerius,
        planus ir kitą turinį.
      </Text>

      <Tabs value={tab} onChange={setTab} mt="lg">
        <Tabs.List>
          <Tabs.Tab value="users">Users</Tabs.Tab>
          <Tabs.Tab value="profiles">Users profiles</Tabs.Tab>
          <Tabs.Tab value="coaches">Coaches profiles</Tabs.Tab>
          <Tabs.Tab value="coach-exercises">Coaches exercises</Tabs.Tab>
          <Tabs.Tab value="chat-rooms">Chat Rooms</Tabs.Tab>
          <Tabs.Tab value="chat-messages">Chat Messages</Tabs.Tab>
          <Tabs.Tab value="orders">Orders</Tabs.Tab>
          <Tabs.Tab value="products">Products</Tabs.Tab>
          <Tabs.Tab value="plans">Plans</Tabs.Tab>
          <Tabs.Tab value="progress-goals">Progress Goals</Tabs.Tab>
          <Tabs.Tab value="progress-entries">Progress Entries</Tabs.Tab>
          <Tabs.Tab value="splits">Planner Splits</Tabs.Tab>
          <Tabs.Tab value="workouts">Planner Workouts</Tabs.Tab>
          <Tabs.Tab value="catalog-exercises">Admin Exercises</Tabs.Tab>

          
          <Tabs.Tab value="plans" disabled>
            Planai
          </Tabs.Tab>
          <Tabs.Tab value="payments" disabled>
            Mokėjimai
          </Tabs.Tab>
          <Tabs.Tab value="forum" disabled>
            Forumas
          </Tabs.Tab>
        </Tabs.List>

        {/* Users */}
        <Tabs.Panel value="users" pt="md">
          <AdminUsersSection />
        </Tabs.Panel>

        {/* Profiles */}
        <Tabs.Panel value="profiles" pt="md">
          <AdminProfilesSection />
        </Tabs.Panel>

        {/* Coaches */}
        <Tabs.Panel value="coaches" pt="md">
          <AdminCoachProfilesSection />
        </Tabs.Panel>

        {/* Coaches exercises */}
        <Tabs.Panel value="coach-exercises" pt="md">
          <AdminCoachExercisesSection />
        </Tabs.Panel>

        {/* Chat rooms */}
        <Tabs.Panel value="chat-rooms" pt="md">
          <AdminChatRoomsSection />
        </Tabs.Panel>

        {/* Chat messages */}
        <Tabs.Panel value="chat-messages" pt="md">
          <AdminChatMessagesSection />
        </Tabs.Panel>

        {/* Orders */}
        <Tabs.Panel value="orders" pt="md">
          <AdminOrdersSection />
        </Tabs.Panel>

        {/* Products */}
        <Tabs.Panel value="products" pt="md">
          <AdminProductsSection />
        </Tabs.Panel>

        {/* Plans */}
        <Tabs.Panel value="plans" pt="md">
          <AdminPlansSection />
        </Tabs.Panel>

        {/* Progress Goals */}
        <Tabs.Panel value="progress-goals" pt="md">
          <AdminProgressGoalsSection />
        </Tabs.Panel>

        {/* Progress Entries */}
        <Tabs.Panel value="progress-entries" pt="md">
          <AdminProgressEntriesSection />
        </Tabs.Panel>

        {/* Planner Splits */}
        <Tabs.Panel value="splits" pt="md">
          <AdminSplitsSection />
        </Tabs.Panel>

        {/* Planner Workouts */}
        <Tabs.Panel value="workouts" pt="md">
          <AdminPlannerWorkoutsSection />
        </Tabs.Panel>

        {/* Admin Exercises */}
        <Tabs.Panel value="catalog-exercises" pt="md">
          <AdminExercisesSection />
        </Tabs.Panel>

      </Tabs>
    </Box>
  );
}