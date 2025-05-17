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
  notification,
  Spin,
} from "antd";
import { UploadOutlined, CloseOutlined } from "@ant-design/icons";
import { auth } from "../context/firebase";
import styles from "./CreateProfileModal.module.less";
import { useGlobal } from "../context";
import { TypeAnimation } from 'react-type-animation';

const { TextArea } = Input;

export function CreateProfileModal({ visible, onClose, isPersonaOnly = false }) {
  const [form] = Form.useForm();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [hasProfile, setHasProfile] = useState(false);
  const [currentStep, setCurrentStep] = useState(isPersonaOnly ? 1 : 0);
  const [userDetails, setUserDetails] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { newChat } = useGlobal();

  useEffect(() => {
    if (visible) {
      setError("");
      setSuccess("");
      setUserDetails(null);
      setCurrentStep(isPersonaOnly ? 1 : 0);
      form.resetFields();
    }
  }, [visible, isPersonaOnly]);

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
        company_bio: values.company_bio,
        company_url: values.company_url,
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
      setIsGenerating(true);
      // Get all form values
      const values = form.getFieldsValue();
      
      // Get current user from Firebase auth
      const user = auth.currentUser;
      if (!user) {
        setError("No user is currently signed in");
        return;
      }

      // Prepare the payload with persona details
      const payload = {
        // User ID
        uid: user.uid,

        // User Details (from stored state)
        // age_range: userDetails?.age_range || "",
        gender: userDetails?.gender_identity || "",
        location: userDetails?.location || "",
        income_level: userDetails?.income_level || "",
        job_title: userDetails?.job_title || "",
        industry: userDetails?.industry || "",

        // Persona Details
        age_range: values?.age_range || "",
        company_url: values.company_url || "",
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

      const response = await fetch("http://65.109.233.16:8000/prompt_generator", {
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
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateProfile = async (values) => {
    try {
      setIsGenerating(true);
      const user = auth.currentUser;
      if (!user) {
        setError("No user is currently signed in");
        return;
      }

      // First generate the prompt
      const promptPayload = {
        uid: user.uid,
        gender: userDetails?.gender_identity || "",
        location: userDetails?.location || "",
        income_level: userDetails?.income_level || "",
        job_title: userDetails?.job_title || "",
        industry: userDetails?.industry || "",
        age_range: values?.age_range || "",
        company_url: values.company_url || "",
        persona_name: values.persona_name || "",
        persona_role: values.persona_role || "",
        persona_traits: values.persona_traits || "",
        persona_bio: values.persona_bio || "",
        persona_pronouns: values.persona_pronouns || "",
        persona_type: values.persona_type,
        tone: values.tone || "",
        preferred_language: values.preferred_language || "",
        response_length: values.response_length || "",
        response_depth: values.response_depth || "",
        response_behavior: values.response_behavior || "",
        interaction_style: values.interaction_style || "",
      };

      const promptResponse = await fetch("http://65.109.233.16:8000/prompt_generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(promptPayload),
      });

      if (!promptResponse.ok) {
        throw new Error('Failed to generate prompt');
      }

      const promptData = await promptResponse.json();
      const generatedPrompt = promptData.prompt || promptData.response || promptData;

      // Combine user details with current form values and generated prompt
      const combinedValues = {
        ...userDetails,
        ...values,
        persona_prompt: generatedPrompt,
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
        "http://65.109.233.16:3001/api/profiles/create",
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

      // Show success notification
      notification.success({
        message: "Success",
        description: "Persona created successfully!",
        placement: "topRight",
      });

      setSuccess("Profile created successfully!");

      // Create a new chat with the newly created persona
      const newPersona = {
        title: values.persona_name,
        desc: values.persona_bio,
        role: "system",
        persona_type: values.persona_type,
        id: values.persona_type === "general" ? 1 :
            values.persona_type === "fashion" ? 2 :
            values.persona_type === "luxury" ? 3 :
            values.persona_type === "food" ? 4 :
            values.persona_type === "technology" ? 5 : 1
      };
      
      // Start a new chat with this persona
      newChat(newPersona);

      // Reset form and close modal with a delay, then reload the page
      setTimeout(() => {
        form.resetFields();
        setUserDetails(null);
        onClose();
        
        // Only set the flag to run the tour if it hasn't been shown before
        const hasShownTour = localStorage.getItem('danora_has_shown_tour');
        if (!hasShownTour) {
          // Set a flag to indicate that we should run the tour after reload
          localStorage.setItem('danora_run_tour_after_reload', 'true');
        }
        
        // Add a small delay after the modal is closed before reloading
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }, 1000);
    } catch (err) {
      // Show error notification
      notification.error({
        message: "Error",
        description: err.message || "Failed to create persona",
        placement: "topRight",
      });
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const renderUserDetailsStep = () => (
    <>
      {/* Professional Information */}
      <Divider orientation="left">Professional Information</Divider>
      <Form.Item
        name="job_title"
        label="Job Title"
        rules={[
          {
            required: true,
            message: "Please enter preferred products/services",
          },
        ]}
      >
        <Select placeholder="Select job title">
          <Select.Option value="founder_ceo">Founder/CEO</Select.Option>
          <Select.Option value="cmo">CMO</Select.Option>
          <Select.Option value="vp_marketing">VP Marketing</Select.Option>
          <Select.Option value="marketing_ops">Marketing Ops</Select.Option>
          <Select.Option value="product_marketing">
            Product Marketing
          </Select.Option>
          <Select.Option value="social_media_manager">
            Social Media Manager
          </Select.Option>
          <Select.Option value="demand_gen">
            Demand Gen/Acquisition
          </Select.Option>
          <Select.Option value="content_marketing">
            Content Marketing
          </Select.Option>
          <Select.Option value="other">Other</Select.Option>
        </Select>
      </Form.Item>

      {/* <Form.Item name="industry" label="Industry">
        <Input placeholder="Enter industry" />
      </Form.Item> */}

      <Form.Item name="company_size" label="Company Size">
        <Select placeholder="Select company size">
          <Select.Option value="just_me">Just Me</Select.Option>
          <Select.Option value="2-10">2-10</Select.Option>
          <Select.Option value="11-50">11-50</Select.Option>
          <Select.Option value="51-100">51-100</Select.Option>
          <Select.Option value="101-500">101-500</Select.Option>
          <Select.Option value="501-1000">501-1000</Select.Option>
          <Select.Option value="1000+">1000+</Select.Option>
        </Select>
      </Form.Item>

      {/* <Form.Item 
        name="company_url" 
        label="Company URL"
        rules={[
          { type: 'url', message: 'Please enter a valid URL' },
          { required: true, message: 'Please enter your company URL' }
        ]}
      >
        <Input placeholder="Enter company website URL" />
      </Form.Item> */}

      <Form.Item
        name="company_bio"
        label="Company Bio"
        rules={[
          {
            validator: (_, value) => {
              if (!value) return Promise.resolve();
              const wordCount = value.trim().split(/\s+/).length;
              if (wordCount > 100) {
                return Promise.reject("Bio cannot exceed 100 words");
              }
              return Promise.resolve();
            },
          },
        ]}
      >
        <TextArea
          rows={4}
          placeholder="Tell us about your company (maximum 100 words)"
          // showCount={{
          //   formatter: ({ value = '' }) => {
          //     const words = value.trim().split(/\s+/).length;
          //     return `${words}/100 words`;
          //   }
          // }}
        />
      </Form.Item>

      {/* Purchase Preferences */}
      {/* <Divider orientation="left">Purchase Preferences</Divider>
      <Form.Item
        name="preferred_products_services"
        label="Preferred Products/Services"
      >
        <TextArea
          rows={3}
          placeholder="Enter preferred products and services"
        />
      </Form.Item> */}
    </>
  );

  const renderPersonaDetailsStep = () => (
    <>
      <div
        style={{
          marginBottom: "24px",
          fontSize: "15px",
          fontWeight: "500",
          color: "#1890ff",
          textAlign: "center",
          lineHeight: "1.5",
        }}
      >
        <TypeAnimation
          preRenderFirstString={true}
          sequence={[
            500,
            "Create your ultra-detailed persona in just a few clicks", // initially rendered starting point
            1000,
            "Create your Gen Z personas from 1M+ real social media posts",
            1000,
          ]}
          speed={50}
          style={{
            fontSize: "15px",
            fontWeight: "500",
            display: "inline-block",
          }}
          repeat={Infinity}
        />
      </div>
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
        <Input placeholder="Enter persona name" />
      </Form.Item>

      <Form.Item
        name="age_range"
        label="Age Range"
        // rules={[{ required: true, message: "Please select an age range of the persona" }]}
      >
        <Select placeholder="Select age range of the persona">
          <Select.Option value="18-24">18-24</Select.Option>
          <Select.Option value="25-34">25-34</Select.Option>
          <Select.Option value="35-44">35-44</Select.Option>
          <Select.Option value="45-54">45-54</Select.Option>
          <Select.Option value="55-64">55-64</Select.Option>
          <Select.Option value="65+">65+</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="persona_type"
        label="Persona Expertise"
        rules={[{ required: true, message: "Please select a persona type" }]}
      >
        <Select placeholder="Select persona type">
          {/* <Select.Option value="general">General</Select.Option> */}
          <Select.Option value="fashion">Fashion</Select.Option>
          <Select.Option value="luxury">Luxury</Select.Option>
          <Select.Option value="food">Food</Select.Option>
          <Select.Option value="technology">Technology</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="persona_role"
        label="Primary Role"
        rules={[
          {
            required: true,
            min: 2,
            message: "Role must be at least 2 characters.",
          },
        ]}
      >
        <Input placeholder="e.g. Student, Freelancer, Software Engineer" />
      </Form.Item>

      <Form.Item name="persona_traits" label="Traits (comma-separated)">
        <Input placeholder="e.g. Detail-Oriented, Creative, Friendly, Optimistic" />
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
        <TextArea
          rows={4}
          placeholder="e.g. I'm deeply invested in making the world a better place. I keep up with ethical brands, sustainability hacks, and grassroots activism."
        />
      </Form.Item>

      <Form.Item
        name="company_url"
        label="Company URL"
        rules={[
          { type: "url", message: "Please enter a valid URL" },
          { required: true, message: "Please enter your company URL" },
        ]}
      >
        <Input placeholder="Enter company website URL. Your persona will scrape this website." />
      </Form.Item>

      {/* <Form.Item name="persona_pronouns" label="Pronouns">
        <Select placeholder="Select pronouns">
          <Select.Option value="he/him">He/Him</Select.Option>
          <Select.Option value="she/her">She/Her</Select.Option>
          <Select.Option value="they/them">They/Them</Select.Option>
          <Select.Option value="other">Other</Select.Option>
        </Select>
      </Form.Item> */}

      {/* <Form.Item name="profile_picture" label="Persona Photo">
        <Upload>
          <Button icon={<UploadOutlined />}>Upload Picture</Button>
        </Upload>
      </Form.Item> */}

      {/* <Form.Item name="avatar_description" label="Avatar Description">
        <Input placeholder="Describe your avatar" />
      </Form.Item> */}

      {/* Purchase Preferences */}
      <Divider orientation="left">Purchase Preferences</Divider>
      <Form.Item
        name="preferred_products_services"
        label="Preferred Products/Services"
      >
        <TextArea
          rows={3}
          placeholder="e.g. Sustainable, Handmade, Trousers, Nike"
        />
      </Form.Item>

      <Form.Item name="budget" label="Budget">
        <Select placeholder="Select budget range">
          <Select.Option value="low">Low ($1,000 - $10,000)</Select.Option>
          <Select.Option value="medium">
            Medium ($10,000 - $50,000)
          </Select.Option>
          <Select.Option value="high">High ($50,000+)</Select.Option>
        </Select>
      </Form.Item>

      {/* <Form.Item name="purchase_frequency" label="Purchase Frequency">
        <Select placeholder="Select purchase frequency">
          <Select.Option value="rarely">Rarely (Once a year)</Select.Option>
          <Select.Option value="occasionally">
            Occasionally (Quarterly)
          </Select.Option>
          <Select.Option value="frequently">Frequently (Monthly)</Select.Option>
        </Select>
      </Form.Item> */}

      <Form.Item
        name="loyalty_program_participation"
        label="Loyalty Program Participation"
        valuePropName="checked"
      >
        <Switch />
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

      <Form.Item name="interaction_style" label="Interaction Style">
        <Select placeholder="Select interaction style">
          <Select.Option value="direct">Direct</Select.Option>
          <Select.Option value="collaborative">Collaborative</Select.Option>
          <Select.Option value="supportive">Supportive</Select.Option>
        </Select>
      </Form.Item>

      {/* Chat Behavior */}
      {/* <Divider orientation="left">Chat Behavior</Divider>
      <Form.Item
        name="response_behavior"
        label="Response Behavior (comma-separated)"
      >
        <Input placeholder="Enter response behaviors, separated by commas" />
      </Form.Item> */}

      {/* Advanced Settings */}
      {/* <Divider orientation="left">Advanced Settings</Divider>
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
      </Form.Item> */}

      {/* Persona Type */}
      {/* <Form.Item 
        name="persona_type" 
        label="Persona Type"
        rules={[{ required: true, message: 'Please select a persona type' }]}
      >
        <Select placeholder="Select persona type">
          <Select.Option value="general">General</Select.Option>
          <Select.Option value="fashion">Fashion</Select.Option>
          <Select.Option value="luxury">Luxury</Select.Option>
          <Select.Option value="food">Food</Select.Option>
          <Select.Option value="technology">Technology</Select.Option>
        </Select>
      </Form.Item> */}

      {/* Persona Prompt */}
      {/* <Divider orientation="left">Persona Prompt</Divider> */}
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
      title={
        <div style={{ 
          fontSize: "20px", 
          fontWeight: "600", 
          color: "#1890ff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%"
        }}>
          <span>
            {hasProfile ? "Edit Profile" : (currentStep === 0 ? "Create Profile" : "Create Target Persona")}
          </span>
          {(currentStep === 1 || isPersonaOnly) && (
            <CloseOutlined 
              onClick={(e) => {
                e.stopPropagation();
                setError("");
                setSuccess("");
                onClose();
              }} 
              style={{ 
                cursor: "pointer",
                fontSize: "16px",
                color: "#999",
                marginLeft: "250px"
              }}
            />
          )}
        </div>
      }
      draggable={false}
    >
      <div className={styles.profileContainer}>
        <Spin spinning={isGenerating} tip="Creating persona...">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleUpdateProfile}
            className={styles.form}
            onSubmit={(e) => e.preventDefault()}
          >
            {isPersonaOnly ? renderPersonaDetailsStep() : (currentStep === 0 ? renderUserDetailsStep() : renderPersonaDetailsStep())}

            <Form.Item 
              style={{ 
                textAlign: "center", 
                marginTop: "26px",
                marginBottom: "8px"
              }}
            >
              {!isPersonaOnly && currentStep < 1 ? (
                <Space size="large" style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Button 
                    type="primary"
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      try {
                        const values = await form.validateFields(['job_title', 'company_size', 'company_url', 'company_bio']);
                        const user = auth.currentUser;
                        if (!user) {
                          setError("No user is currently signed in");
                          return;
                        }

                        const businessDetails = {
                          uid: user.uid,
                          email: user.email,
                          job_title: values.job_title,
                          company_size: values.company_size,
                          company_url: values.company_url,
                          company_bio: values.company_bio
                        };

                        const response = await fetch(
                          "http://65.109.233.16:3001/api/profiles/create",
                          {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify(businessDetails),
                          }
                        );

                        if (!response.ok) {
                          const errorData = await response.json();
                          throw new Error(errorData.error || "Failed to save business details");
                        }

                        // Show success notification
                        notification.success({
                          message: "Success",
                          description: "Business details saved successfully!",
                          placement: "topRight",
                        });
                        
                        setSuccess("Business details saved successfully!");
                        
                        // Store the business details for later use
                        setUserDetails(businessDetails);
                        
                        // Move to the next step (Persona Details)
                        setCurrentStep(1);
                      } catch (err) {
                        // Show error notification
                        notification.error({
                          message: "Error",
                          description: err.message || "Failed to save business details",
                          placement: "topRight",
                        });
                        setError(err.message);
                      }
                    }}
                    size="large"
                    block
                    style={{
                      height: "40px",
                      fontSize: "16px",
                      fontWeight: "500",
                      borderRadius: "6px",
                      boxShadow: "0 2px 0 rgba(0, 0, 0, 0.045)",
                      borderColor: "#1890ff",
                      color: "white"
                    }}
                  >
                    Register and proceed
                  </Button>
                </Space>
              ) : (
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  style={{
                    height: "40px",
                    fontSize: "16px",
                    fontWeight: "500",
                    borderRadius: "6px",
                    boxShadow: "0 2px 0 rgba(0, 0, 0, 0.045)",
                    marginBottom: "68px"
                  }}
                >
                  {hasProfile ? "Save Changes" : (isPersonaOnly ? "Create Persona" : "Create Persona")}
                </Button>
              )}
            </Form.Item>
          </Form>
        </Spin>
        {error && <div className={styles.error}>{error}</div>}
      </div>
    </Modal>
  );
}
