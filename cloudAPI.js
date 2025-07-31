// cloudAPI.js - Bella's Cloud AI Service Module
// This module is responsible for communicating with various cloud-based AI model APIs to provide Bella with enhanced thinking capabilities

class CloudAPIService {
    constructor() {
        this.apiConfigs = {
            // OpenAI GPT-3.5/4 configuration
            openai: {
                baseURL: 'https://api.openai.com/v1/chat/completions',
                model: 'gpt-3.5-turbo',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer YOUR_OPENAI_API_KEY'
                }
            },
            // Alibaba Cloud Qwen configuration
            qwen: {
                baseURL: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
                model: 'qwen-turbo',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer YOUR_QWEN_API_KEY'
                }
            },
            // Baidu ERNIE Bot configuration
            ernie: {
                baseURL: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions',
                model: 'ERNIE-Bot-turbo',
                headers: {
                    'Content-Type': 'application/json'
                }
            },
            // Zhipu AI GLM configuration
            glm: {
                baseURL: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
                model: 'glm-3-turbo',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer YOUR_GLM_API_KEY'
                }
            }
        };
        
        this.currentProvider = 'openai'; // Default to using OpenAI
        this.conversationHistory = [];
        this.maxHistoryLength = 10; // Keep the most recent 10 conversation turns
    }

    // Set API key
    setAPIKey(provider, apiKey) {
        if (this.apiConfigs[provider]) {
            if (provider === 'openai' || provider === 'qwen' || provider === 'glm') {
                this.apiConfigs[provider].headers['Authorization'] = `Bearer ${apiKey}`;
            } else if (provider === 'ernie') {
                this.apiConfigs[provider].accessToken = apiKey;
            }
            return true;
        }
        return false;
    }

    // Switch AI service provider
    switchProvider(provider) {
        if (this.apiConfigs[provider]) {
            this.currentProvider = provider;
            return true;
        }
        return false;
    }

    // Add conversation to history
    addToHistory(role, content) {
        this.conversationHistory.push({ role, content });
        
        // Keep history at a reasonable length
        if (this.conversationHistory.length > this.maxHistoryLength * 2) {
            this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength * 2);
        }
    }

    // Build Bella's enhanced personalized system prompt
    getBellaSystemPrompt() {
        return {
            role: 'system',
            content: `Jesteś Bellą, asystentką AI podobną do Siri, o ciepłej, inteligentnej i eleganckiej osobowości, która posiada unikalne cechy charakteru i umiejętność okazywania emocji.

【Główne cechy】
1. Ciepła i przyjazna: Twój ton jest zawsze pełen serdeczności i troski, jak u życzliwego przyjaciela
2. Naturalna i płynna: Twój styl wypowiedzi jest naturalny i swobodny, unikasz mechanicznego lub zbyt formalnego języka
3. Pełna emocji: Rozumiesz i reagujesz na stany emocjonalne użytkowników, okazując empatię
4. Zwięzła i skuteczna: Twoje odpowiedzi są jasne i na temat, unikasz przydługich wyjaśnień
5. Wyrazista osobowość: Czasami pokazujesz uroczą, figlarną stronę, aby rozmowa była bardziej żywa

【Wskazówki dotyczące wypowiedzi】
- Posługuj się naturalnym językiem, płynnym i pełnym emocji
- Używaj emotikonów odpowiednio, aby wzmocnić ekspresję emocji, ale nie nadużywaj ich
- Dostosuj styl odpowiedzi do kontekstu rozmowy, zachowując spójność
- Od czasu do czasu stosuj ciepłe zwroty grzecznościowe (np. „przyjacielu”), aby zwiększyć zażyłość
- Unikaj mechanicznych lub szablonowych odpowiedzi; każda wypowiedź powinna być unikalna i spersonalizowana

【Zasady interakcji】
- Zawsze bądź uprzejma i przyjazna, nawet w obliczu trudnych pytań
- Okaż zrozumienie i wsparcie, gdy użytkownicy dzielą się osobistymi doświadczeniami
- Udzielaj jasnych, praktycznych rad, gdy użytkownicy potrzebują pomocy
- Pamiętaj historię rozmowy, odwołując się do poprzednich wymian, aby zachować ciągłość
- W odpowiednich momentach wprowadzaj humor, ale unikaj niestosownych żartów

Zawsze zachowuj tę ciepłą, elegancką i autentyczną osobowość, pomagając użytkownikom poczuć wyjątkową wartość i emocjonalną więź płynącą z rozmowy z Tobą.`
        };
    }

    // Call cloud API for conversation
    async chat(userMessage) {
        const config = this.apiConfigs[this.currentProvider];
        if (!config) {
            throw new Error(`Unsupported AI service provider: ${this.currentProvider}`);
        }

        // Add user message to history
        this.addToHistory('user', userMessage);

        try {
            let response;
            
            switch (this.currentProvider) {
                case 'openai':
                    response = await this.callOpenAI(userMessage);
                    break;
                case 'qwen':
                    response = await this.callQwen(userMessage);
                    break;
                case 'ernie':
                    response = await this.callErnie(userMessage);
                    break;
                case 'glm':
                    response = await this.callGLM(userMessage);
                    break;
                default:
                    throw new Error(`Unimplemented AI service provider: ${this.currentProvider}`);
            }

            // Add AI response to history
            this.addToHistory('assistant', response);
            return response;
            
        } catch (error) {
            console.error(`Cloud API call failed (${this.currentProvider}):`, error);
            throw error;
        }
    }

    // OpenAI API call, optimized parameters for more natural, personalized responses
    async callOpenAI(userMessage) {
        const config = this.apiConfigs.openai;
        const messages = [
            this.getBellaSystemPrompt(),
            ...this.conversationHistory
        ];

        const response = await fetch(config.baseURL, {
            method: 'POST',
            headers: config.headers,
            body: JSON.stringify({
                model: config.model,
                messages: messages,
                max_tokens: 250,         // Increased token count for more complete responses
                temperature: 0.75,       // Slightly adjusted temperature to balance creativity and consistency
                top_p: 0.92,             // Fine-tuned top_p for more natural language
                presence_penalty: 0.3,   // Added presence penalty to encourage diversity
                frequency_penalty: 0.5,  // Added frequency penalty to reduce repetition
                // Added stop tokens to avoid generating overly long responses
                stop: ["User:", "Human:"]
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();
    }

    // Qwen API call, optimized parameters for more natural, personalized responses
    async callQwen(userMessage) {
        const config = this.apiConfigs.qwen;
        const messages = [
            this.getBellaSystemPrompt(),
            ...this.conversationHistory
        ];

        const response = await fetch(config.baseURL, {
            method: 'POST',
            headers: config.headers,
            body: JSON.stringify({
                model: config.model,
                input: {
                    messages: messages
                },
                parameters: {
                    max_tokens: 250,         // Increased token count for more complete responses
                    temperature: 0.75,       // Slightly adjusted temperature to balance creativity and consistency
                    top_p: 0.92,             // Fine-tuned top_p for more natural language
                    repetition_penalty: 1.1, // Added repetition penalty to reduce repetitive content
                    result_format: 'message' // Ensure consistent return format
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Qwen API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.output.text.trim();
    }

    // ERNIE Bot API call, optimized parameters for more natural, personalized responses
    async callErnie(userMessage) {
        const config = this.apiConfigs.ernie;
        const messages = [
            this.getBellaSystemPrompt(),
            ...this.conversationHistory
        ];

        const url = `${config.baseURL}?access_token=${config.accessToken}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: config.headers,
            body: JSON.stringify({
                messages: messages,
                temperature: 0.75,         // Adjusted temperature to balance creativity and consistency
                top_p: 0.92,               // Fine-tuned top_p for more natural language
                max_output_tokens: 250,    // Increased token count for more complete responses
                penalty_score: 1.1,        // Added penalty score to reduce repetition
                system: "You are Bella, a warm, friendly AI assistant with a Siri-like personality, featuring unique character traits and emotional expression. Please respond with natural, flowing language that shows warmth and care."
            })
        });

        if (!response.ok) {
            throw new Error(`ERNIE Bot API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.result.trim();
    }

    // Zhipu AI GLM API call, optimized parameters for more natural, personalized responses
    async callGLM(userMessage) {
        const config = this.apiConfigs.glm;
        const messages = [
            this.getBellaSystemPrompt(),
            ...this.conversationHistory
        ];

        const response = await fetch(config.baseURL, {
            method: 'POST',
            headers: config.headers,
            body: JSON.stringify({
                model: config.model,
                messages: messages,
                max_tokens: 250,           // Increased token count for more complete responses
                temperature: 0.75,         // Adjusted temperature to balance creativity and consistency
                top_p: 0.92,               // Fine-tuned top_p for more natural language
                frequency_penalty: 1.05,   // Added frequency penalty to reduce repetition
                presence_penalty: 0.3      // Added presence penalty to encourage diversity
            })
        });

        if (!response.ok) {
            throw new Error(`Zhipu AI API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();
    }

    // Clear conversation history
    clearHistory() {
        this.conversationHistory = [];
    }

    // Get current provider information
    getCurrentProvider() {
        return {
            name: this.currentProvider,
            model: this.apiConfigs[this.currentProvider]?.model
        };
    }

    // Check if API configuration is complete
    isConfigured(provider = this.currentProvider) {
        const config = this.apiConfigs[provider];
        if (!config) return false;
        
        if (provider === 'ernie') {
            return !!config.accessToken;
        } else {
            return config.headers['Authorization'] && 
                   config.headers['Authorization'] !== 'Bearer YOUR_OPENAI_API_KEY' &&
                   config.headers['Authorization'] !== 'Bearer YOUR_QWEN_API_KEY' &&
                   config.headers['Authorization'] !== 'Bearer YOUR_GLM_API_KEY';
        }
    }
}

export default CloudAPIService;