import React, { useState, useEffect } from "react";
import { Modal, Button } from "@/components";
import {
  Form,
  Input,
  Select,
  Divider,
  Switch,
  Upload,
  Steps,
  Space,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { auth } from "../context/firebase";
import styles from "./CreateProfileModal.module.less";

const { TextArea } = Input;

export function CreateProfileModal({ visible, onClose }) {
  const [form] = Form.useForm();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [hasProfile, setHasProfile] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [userDetails, setUserDetails] = useState(null);

  useEffect(() => {
    if (visible) {
      setError("");
      setSuccess("");
      setUserDetails(null);
      setCurrentStep(0);
      form.resetFields();
    }
  }, [visible]);

  const handleNext = async (e) => {
    e.preventDefault(); // Prevent form submission
    try {
      // Get all the current form values
      const values = await form.validateFields();

      // Store user details when moving to next step
      setUserDetails({
        age_range: values.age_range,
        gender_identity: values.gender_identity,
        location: values.location,
        income_level: values.income_level,
        job_title: values.job_title,
        industry: values.industry,
        company_size: values.company_size,
        preferred_products_services: values.preferred_products_services,
        budget: values.budget,
        purchase_frequency: values.purchase_frequency,
        loyalty_program_participation: values.loyalty_program_participation,
      });

      setCurrentStep(currentStep + 1);
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  const handlePrevious = (e) => {
    e.preventDefault(); // Prevent form submission
    setCurrentStep(currentStep - 1);
  };

  const handleGenerateChat = async (e) => {
    e.preventDefault(); // Prevent form submission
    try {
      // Get all form values
      const values = form.getFieldsValue();
      
      // Prepare the payload with persona details
      const payload = {
        // User Details (from stored state)
        age_range: userDetails?.age_range || "",
        gender: userDetails?.gender_identity || "",
        location: userDetails?.location || "",
        income_level: userDetails?.income_level || "",
        job_title: userDetails?.job_title || "",
        industry: userDetails?.industry || "",

        // Persona Details
        persona_name: values.persona_name || "",
        persona_role: values.persona_role || "",
        persona_traits: values.persona_traits || "",
        persona_bio: values.persona_bio || "",
        persona_pronouns: values.persona_pronouns || "",
        persona_type: values.persona_type,

        // Communication Style
        tone: values.tone || "",
        preferred_language: values.preferred_language || "",
        response_length: values.response_length || "",
        response_depth: values.response_depth || "",

        // Chat Behavior
        response_behavior: values.response_behavior || "",
        interaction_style: values.interaction_style || "",
      };

      console.log('Sending payload to prompt generator:', payload);

      const response = await fetch("http://34.68.23.90:8000/prompt_generator", {
      // const response = await fetch("http://localhost:8000/prompt_generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      console.log('Response:', response);

      if (!response.ok) {
        throw new Error('Failed to generate prompt');
      }

      const data = await response.json();
      console.log('Generated prompt:', data);

      // Update the TextArea with the generated prompt
      form.setFieldsValue({
        persona_prompt: data.prompt || data.response || data // handle different response formats
      });

    } catch (error) {
      console.error("Error generating prompt:", error);
      setError("Failed to generate prompt");
    }
  };

  const handleUpdateProfile = async (values) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setError("No user is currently signed in");
        return;
      }

      // Combine user details with current form values
      const combinedValues = {
        ...userDetails, // Include stored user details from first step
        ...values, // Current form values (persona details)
        uid: user.uid,
        email: user.email,
      };

      console.log("Combined values:", combinedValues);

      // Transform comma-separated strings into arrays
      const transformedValues = {
        ...combinedValues,
      };

      // Handle file upload if profile picture is present
      if (values.profile_picture && values.profile_picture[0]) {
        transformedValues.profile_picture = values.profile_picture[0].name;
      }

      console.log("Sending profile creation with data:", transformedValues);

      const response = await fetch(
        "http://34.68.23.90:3001/api/profiles/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(transformedValues),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Profile creation failed:", errorData);
        throw new Error(errorData.error || "Failed to create profile");
      }

      const data = await response.json();
      console.log("Profile saved to MongoDB:", data);

      setSuccess("Profile created successfully!");

      window.location.reload();

      setTimeout(() => {
        form.resetFields();
        setUserDetails(null);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message);
    }
  };

  const renderUserDetailsStep = () => (
    <>
      {/* Demographics */}
      <Divider orientation="left">Demographics</Divider>
      <Form.Item name="age_range" label="Age Range">
        <Select placeholder="Select age range">
          <Select.Option value="18-24">18-24</Select.Option>
          <Select.Option value="25-34">25-34</Select.Option>
          <Select.Option value="35-44">35-44</Select.Option>
          <Select.Option value="45-54">45-54</Select.Option>
          <Select.Option value="55+">55+</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item name="gender_identity" label="Gender Identity">
        <Select placeholder="Select gender identity">
          <Select.Option value="male">Male</Select.Option>
          <Select.Option value="female">Female</Select.Option>
          <Select.Option value="non-binary">Non-binary</Select.Option>
          <Select.Option value="other">Other</Select.Option>
          <Select.Option value="prefer-not-to-say">
            Prefer not to say
          </Select.Option>
        </Select>
      </Form.Item>

      <Form.Item name="location" label="Location">
        <Input placeholder="Enter location" />
      </Form.Item>

      <Form.Item name="income_level" label="Income Level">
        <Select placeholder="Select income level">
          <Select.Option value="entry">Entry Level</Select.Option>
          <Select.Option value="mid">Mid Level</Select.Option>
          <Select.Option value="senior">Senior Level</Select.Option>
          <Select.Option value="executive">Executive Level</Select.Option>
        </Select>
      </Form.Item>

      {/* Professional Information */}
      <Divider orientation="left">Professional Information</Divider>
      <Form.Item name="job_title" label="Job Title">
        <Input placeholder="Enter job title" />
      </Form.Item>

      <Form.Item name="industry" label="Industry">
        <Input placeholder="Enter industry" />
      </Form.Item>

      <Form.Item name="company_size" label="Company Size">
        <Select placeholder="Select company size">
          <Select.Option value="startup">Startup</Select.Option>
          <Select.Option value="small">Small</Select.Option>
          <Select.Option value="medium">Medium</Select.Option>
          <Select.Option value="large">Large</Select.Option>
        </Select>
      </Form.Item>

      {/* Purchase Preferences */}
      <Divider orientation="left">Purchase Preferences</Divider>
      <Form.Item
        name="preferred_products_services"
        label="Preferred Products/Services"
      >
        <TextArea
          rows={3}
          placeholder="Enter preferred products and services"
        />
      </Form.Item>

      <Form.Item name="budget" label="Budget">
        <Select placeholder="Select budget range">
          <Select.Option value="low">Low</Select.Option>
          <Select.Option value="medium">Medium</Select.Option>
          <Select.Option value="high">High</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item name="purchase_frequency" label="Purchase Frequency">
        <Select placeholder="Select purchase frequency">
          <Select.Option value="rarely">Rarely</Select.Option>
          <Select.Option value="occasionally">Occasionally</Select.Option>
          <Select.Option value="frequently">Frequently</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="loyalty_program_participation"
        label="Loyalty Program Participation"
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>
    </>
  );

  const renderPersonaDetailsStep = () => (
    <>
      {/* Persona Details */}
      <Divider orientation="left">Persona Details</Divider>
      <Form.Item
        name="persona_name"
        label="Name"
        rules={[
          {
            required: true,
            min: 2,
            message: "Name must be at least 2 characters.",
          },
        ]}
      >
        <Input placeholder="Enter your name" />
      </Form.Item>

      <Form.Item
        name="persona_role"
        label="Role"
        rules={[
          {
            required: true,
            min: 2,
            message: "Role must be at least 2 characters.",
          },
        ]}
      >
        <Input placeholder="Enter your role" />
      </Form.Item>

      <Form.Item name="persona_traits" label="Traits (comma-separated)">
        <Input placeholder="Enter traits, separated by commas" />
      </Form.Item>

      <Form.Item
        name="persona_bio"
        label="Bio"
        rules={[
          {
            required: true,
            min: 10,
            message: "Bio must be at least 10 characters.",
          },
        ]}
      >
        <TextArea rows={4} placeholder="Tell us about yourself" />
      </Form.Item>

      <Form.Item name="persona_pronouns" label="Pronouns">
        <Select placeholder="Select pronouns">
          <Select.Option value="he/him">He/Him</Select.Option>
          <Select.Option value="she/her">She/Her</Select.Option>
          <Select.Option value="they/them">They/Them</Select.Option>
          <Select.Option value="other">Other</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item name="profile_picture" label="Profile Picture">
        <Upload>
          <Button icon={<UploadOutlined />}>Upload Picture</Button>
        </Upload>
      </Form.Item>

      <Form.Item name="avatar_description" label="Avatar Description">
        <Input placeholder="Describe your avatar" />
      </Form.Item>

      {/* Communication Style */}
      <Divider orientation="left">Communication Style</Divider>
      <Form.Item name="tone" label="Tone">
        <Select placeholder="Select tone">
          <Select.Option value="formal">Formal</Select.Option>
          <Select.Option value="casual">Casual</Select.Option>
          <Select.Option value="friendly">Friendly</Select.Option>
          <Select.Option value="professional">Professional</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item name="preferred_language" label="Preferred Language">
        <Select placeholder="Select language">
          <Select.Option value="english">English</Select.Option>
          <Select.Option value="spanish">Spanish</Select.Option>
          <Select.Option value="french">French</Select.Option>
          <Select.Option value="german">German</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item name="response_length" label="Response Length">
        <Select placeholder="Select response length">
          <Select.Option value="brief">Brief</Select.Option>
          <Select.Option value="moderate">Moderate</Select.Option>
          <Select.Option value="detailed">Detailed</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item name="response_depth" label="Response Depth">
        <Select placeholder="Select response depth">
          <Select.Option value="basic">Basic</Select.Option>
          <Select.Option value="intermediate">Intermediate</Select.Option>
          <Select.Option value="advanced">Advanced</Select.Option>
        </Select>
      </Form.Item>

      {/* Chat Behavior */}
      <Divider orientation="left">Chat Behavior</Divider>
      <Form.Item
        name="response_behavior"
        label="Response Behavior (comma-separated)"
      >
        <Input placeholder="Enter response behaviors, separated by commas" />
      </Form.Item>

      {/* Advanced Settings */}
      <Divider orientation="left">Advanced Settings</Divider>
      <Form.Item name="knowledge_base" label="Knowledge Base (comma-separated)">
        <Input placeholder="Enter knowledge base topics, separated by commas" />
      </Form.Item>

      <Form.Item
        name="memory_settings"
        label="Memory Settings (comma-separated)"
      >
        <Input placeholder="Enter memory settings, separated by commas" />
      </Form.Item>

      <Form.Item name="interaction_style" label="Interaction Style">
        <Select placeholder="Select interaction style">
          <Select.Option value="direct">Direct</Select.Option>
          <Select.Option value="collaborative">Collaborative</Select.Option>
          <Select.Option value="supportive">Supportive</Select.Option>
        </Select>
      </Form.Item>

      {/* Persona Type */}
      <Form.Item 
        name="persona_type" 
        label="Persona Type"
        rules={[{ required: true, message: 'Please select a persona type' }]}
      >
        <Select placeholder="Select persona type">
          <Select.Option value="general">General</Select.Option>
          <Select.Option value="fashion">Fashion</Select.Option>
          <Select.Option value="luxury">Luxury</Select.Option>
          <Select.Option value="food">Food</Select.Option>
          <Select.Option value="tech">Tech</Select.Option>
        </Select>
      </Form.Item>

      {/* Persona Prompt */}
      <Divider orientation="left">Persona Prompt</Divider>
      <Form.Item
        name="persona_prompt"
        label={
          <Space>
            Persona Prompt
            <Button 
              type="primary" 
              size="small" 
              onClick={handleGenerateChat}
              htmlType="button" // Explicitly set button type to prevent form submission
            >
              Generate Prompt
            </Button>
          </Space>
        }
      >
        <TextArea
          rows={4}
          placeholder="Enter a prompt to generate chat with this persona"
        />
      </Form.Item>
    </>
  );

  return (
    <Modal
      visible={visible}
      onClose={() => {
        setError("");
        setSuccess("");
        onClose();
      }}
      title={hasProfile ? "Edit Profile" : "Create Profile"}
    >
      <div className={styles.profileContainer}>
        <Steps
          current={currentStep}
          items={[{ title: "User Details" }, { title: "Persona Details" }]}
          style={{ marginBottom: "24px" }}
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateProfile}
          className={styles.form}
          onSubmit={(e) => e.preventDefault()} // Prevent default form submission
        >
          {currentStep === 0
            ? renderUserDetailsStep()
            : renderPersonaDetailsStep()}

          <Form.Item style={{ textAlign: "center", marginTop: "24px" }}>
            {currentStep > 0 && (
              <Button
                onClick={handlePrevious}
                style={{ marginRight: "8px" }}
                htmlType="button"
              >
                Previous
              </Button>
            )}
            {currentStep < 1 ? (
              <Button type="primary" onClick={handleNext} htmlType="button">
                Next
              </Button>
            ) : (
              <Button
                type="primary"
                htmlType="submit"
                className={styles.createProfileButton}
                style={{
                  backgroundColor: "#1890ff",
                  width: "200px",
                  height: "40px",
                }}
              >
                {hasProfile ? "Save Changes" : "Create Profile"}
              </Button>
            )}
          </Form.Item>
        </Form>
        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}
      </div>
    </Modal>
  );
}
