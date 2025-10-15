import { useState } from 'react'
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Button,
  Input,
  FormControl,
  FormLabel,
  FormHelperText,
  useToast,
  Card,
  CardBody,
  Icon,
  Progress,
  Badge,
  HStack,
  Flex,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react'
import { FiFile, FiDownload, FiHeart, FiLink, FiUpload } from 'react-icons/fi'
import axios from 'axios'

// API URL - bisa diubah via environment variable saat build
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function App() {
  const [file, setFile] = useState(null)
  const [url, setUrl] = useState('')
  const [sheetName, setSheetName] = useState('Data')
  const [sheetNameUrl, setSheetNameUrl] = useState('Data')
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0]
    if (selectedFile) {
      const fileExt = selectedFile.name.split('.').pop().toLowerCase()
      if (!['json', 'csv'].includes(fileExt)) {
        toast({
          title: 'Format file tidak valid',
          description: 'Gunakan file .json atau .csv',
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
        return
      }
      setFile(selectedFile)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!file) {
      toast({
        title: 'Pilih file',
        description: 'Silakan pilih file JSON atau CSV terlebih dahulu',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setLoading(true)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('sheet_name', sheetName)

    try {
      const response = await axios.post(`${API_URL}/convert`, formData, {
        responseType: 'blob',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      // Download file
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${file.name.split('.')[0]}_converted.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()

      toast({
        title: 'Konversi berhasil!',
        description: 'File Excel telah berhasil diunduh',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })

      // Reset form
      setFile(null)
      event.target.reset()
    } catch (error) {
      console.error('Error:', error)
      console.error('Error response:', error.response)

      let errorMessage = 'Terjadi kesalahan saat konversi'

      if (error.response) {
        // Server responded with error
        if (error.response.data instanceof Blob) {
          // Error response is Blob, need to read it
          try {
            const text = await error.response.data.text()
            const errorData = JSON.parse(text)
            errorMessage = errorData.detail || errorMessage
          } catch (e) {
            console.error('Failed to parse error blob:', e)
          }
        } else if (error.response.data?.detail) {
          errorMessage = error.response.data.detail
        }

        errorMessage += ` (Status: ${error.response.status})`
      } else if (error.request) {
        // Request made but no response
        errorMessage = 'Tidak dapat terhubung ke server. Pastikan backend sedang berjalan di http://localhost:8000'
      } else {
        // Something else happened
        errorMessage = error.message || errorMessage
      }

      toast({
        title: 'Konversi gagal',
        description: errorMessage,
        status: 'error',
        duration: 7000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setSheetName('Data')
  }

  const handleUrlSubmit = async (event) => {
    event.preventDefault()

    if (!url) {
      toast({
        title: 'Masukkan URL',
        description: 'Silakan masukkan URL file JSON atau CSV terlebih dahulu',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setLoading(true)

    try {
      const response = await axios.post(
        `${API_URL}/convert-url`,
        {
          url: url,
          sheet_name: sheetNameUrl,
        },
        {
          responseType: 'blob',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      // Download file
      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = downloadUrl
      link.setAttribute('download', `url_converted.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()

      toast({
        title: 'Konversi berhasil!',
        description: 'File Excel telah berhasil diunduh',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })

      // Reset form
      setUrl('')
      setSheetNameUrl('Data')
    } catch (error) {
      console.error('Error:', error)
      console.error('Error response:', error.response)

      let errorMessage = 'Terjadi kesalahan saat konversi'

      if (error.response) {
        // Server responded with error
        if (error.response.data instanceof Blob) {
          // Error response is Blob, need to read it
          try {
            const text = await error.response.data.text()
            const errorData = JSON.parse(text)
            errorMessage = errorData.detail || errorMessage
          } catch (e) {
            console.error('Failed to parse error blob:', e)
          }
        } else if (error.response.data?.detail) {
          errorMessage = error.response.data.detail
        }

        errorMessage += ` (Status: ${error.response.status})`
      } else if (error.request) {
        // Request made but no response
        errorMessage =
          'Tidak dapat terhubung ke server. Pastikan backend sedang berjalan di http://localhost:8000'
      } else {
        // Something else happened
        errorMessage = error.message || errorMessage
      }

      toast({
        title: 'Konversi gagal',
        description: errorMessage,
        status: 'error',
        duration: 7000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUrlReset = () => {
    setUrl('')
    setSheetNameUrl('Data')
  }

  return (
    <Box minH="100vh" bg="gray.50" py={10}>
      <Container maxW="container.md">
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <VStack spacing={2}>
            <Heading size="xl" color="blue.600">
              Konversi Data ke Excel
            </Heading>
            <Text color="gray.600" textAlign="center">
              Konversi file JSON atau CSV ke format Excel (.xlsx) dengan mudah
            </Text>
          </VStack>

          {/* Main Card */}
          <Card>
            <CardBody>
              <Tabs colorScheme="blue" isFitted>
                <TabList mb={6}>
                  <Tab>
                    <Icon as={FiUpload} mr={2} />
                    Upload File
                  </Tab>
                  <Tab>
                    <Icon as={FiLink} mr={2} />
                    Dari URL
                  </Tab>
                </TabList>

                <TabPanels>
                  {/* Tab 1: Upload File */}
                  <TabPanel p={0}>
                    <form onSubmit={handleSubmit}>
                      <VStack spacing={6} align="stretch">
                        {/* File Upload */}
                        <FormControl isRequired>
                          <FormLabel>Upload File</FormLabel>
                          <Input
                            type="file"
                            accept=".json,.csv"
                            onChange={handleFileChange}
                            p={1}
                            disabled={loading}
                          />
                          <FormHelperText>
                            Format yang didukung: .json dan .csv
                          </FormHelperText>
                        </FormControl>

                        {/* Selected File Info */}
                        {file && (
                          <HStack
                            p={4}
                            bg="blue.50"
                            borderRadius="md"
                            borderWidth={1}
                            borderColor="blue.200"
                          >
                            <Icon as={FiFile} color="blue.500" boxSize={5} />
                            <VStack align="start" spacing={0} flex={1}>
                              <Text fontWeight="medium">{file.name}</Text>
                              <Text fontSize="sm" color="gray.600">
                                {(file.size / 1024).toFixed(2)} KB
                              </Text>
                            </VStack>
                            <Badge colorScheme="blue">
                              {file.name.split('.').pop().toUpperCase()}
                            </Badge>
                          </HStack>
                        )}

                        {/* Sheet Name */}
                        <FormControl>
                          <FormLabel>Nama Sheet Excel</FormLabel>
                          <Input
                            value={sheetName}
                            onChange={(e) => setSheetName(e.target.value)}
                            placeholder="Data"
                            disabled={loading}
                          />
                          <FormHelperText>
                            Nama sheet yang akan dibuat di file Excel
                          </FormHelperText>
                        </FormControl>

                        {/* Progress */}
                        {loading && (
                          <Box>
                            <Text mb={2} fontSize="sm" color="gray.600">
                              Sedang memproses...
                            </Text>
                            <Progress size="sm" isIndeterminate colorScheme="blue" />
                          </Box>
                        )}

                        {/* Buttons */}
                        <HStack spacing={4}>
                          <Button
                            type="submit"
                            colorScheme="blue"
                            leftIcon={<Icon as={FiDownload} />}
                            isLoading={loading}
                            loadingText="Konversi..."
                            flex={1}
                          >
                            Konversi ke Excel
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleReset}
                            disabled={loading}
                          >
                            Reset
                          </Button>
                        </HStack>
                      </VStack>
                    </form>
                  </TabPanel>

                  {/* Tab 2: Dari URL */}
                  <TabPanel p={0}>
                    <form onSubmit={handleUrlSubmit}>
                      <VStack spacing={6} align="stretch">
                        {/* URL Input */}
                        <FormControl isRequired>
                          <FormLabel>URL File JSON/CSV</FormLabel>
                          <Input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://example.com/data.json"
                            disabled={loading}
                          />
                          <FormHelperText>
                            Masukkan URL lengkap file JSON atau CSV
                          </FormHelperText>
                        </FormControl>

                        {/* URL Info */}
                        {url && (
                          <HStack
                            p={4}
                            bg="green.50"
                            borderRadius="md"
                            borderWidth={1}
                            borderColor="green.200"
                          >
                            <Icon as={FiLink} color="green.500" boxSize={5} />
                            <VStack align="start" spacing={0} flex={1}>
                              <Text fontWeight="medium" fontSize="sm" noOfLines={1}>
                                {url}
                              </Text>
                              <Text fontSize="xs" color="gray.600">
                                URL siap diproses
                              </Text>
                            </VStack>
                          </HStack>
                        )}

                        {/* Sheet Name */}
                        <FormControl>
                          <FormLabel>Nama Sheet Excel</FormLabel>
                          <Input
                            value={sheetNameUrl}
                            onChange={(e) => setSheetNameUrl(e.target.value)}
                            placeholder="Data"
                            disabled={loading}
                          />
                          <FormHelperText>
                            Nama sheet yang akan dibuat di file Excel
                          </FormHelperText>
                        </FormControl>

                        {/* Progress */}
                        {loading && (
                          <Box>
                            <Text mb={2} fontSize="sm" color="gray.600">
                              Sedang mengunduh dan memproses...
                            </Text>
                            <Progress size="sm" isIndeterminate colorScheme="blue" />
                          </Box>
                        )}

                        {/* Buttons */}
                        <HStack spacing={4}>
                          <Button
                            type="submit"
                            colorScheme="blue"
                            leftIcon={<Icon as={FiDownload} />}
                            isLoading={loading}
                            loadingText="Konversi..."
                            flex={1}
                          >
                            Konversi ke Excel
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleUrlReset}
                            disabled={loading}
                          >
                            Reset
                          </Button>
                        </HStack>
                      </VStack>
                    </form>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </CardBody>
          </Card>

          {/* Info */}
          <Card bg="blue.50" borderColor="blue.200">
            <CardBody>
              <VStack align="start" spacing={3}>
                <Heading size="sm" color="blue.700">
                  Cara Penggunaan:
                </Heading>

                <Box>
                  <Text fontSize="sm" fontWeight="semibold" color="blue.600" mb={1}>
                    Opsi 1: Upload File
                  </Text>
                  <Text fontSize="sm" color="gray.700">
                    1. Pilih tab "Upload File"
                  </Text>
                  <Text fontSize="sm" color="gray.700">
                    2. Pilih file JSON atau CSV dari komputer Anda
                  </Text>
                  <Text fontSize="sm" color="gray.700">
                    3. Atur nama sheet (opsional)
                  </Text>
                  <Text fontSize="sm" color="gray.700">
                    4. Klik "Konversi ke Excel"
                  </Text>
                </Box>

                <Box>
                  <Text fontSize="sm" fontWeight="semibold" color="blue.600" mb={1}>
                    Opsi 2: Dari URL
                  </Text>
                  <Text fontSize="sm" color="gray.700">
                    1. Pilih tab "Dari URL"
                  </Text>
                  <Text fontSize="sm" color="gray.700">
                    2. Masukkan URL file JSON atau CSV
                  </Text>
                  <Text fontSize="sm" color="gray.700">
                    3. Atur nama sheet (opsional)
                  </Text>
                  <Text fontSize="sm" color="gray.700">
                    4. Klik "Konversi ke Excel"
                  </Text>
                </Box>

                <Text fontSize="xs" color="gray.600" fontStyle="italic" pt={2}>
                  * File Excel akan otomatis terunduh setelah konversi selesai
                </Text>
              </VStack>
            </CardBody>
          </Card>

          {/* Footer */}
          <Flex
            justifyContent="center"
            alignItems="center"
            py={6}
            borderTop="1px"
            borderColor="gray.200"
          >
            <Text fontSize="sm" color="gray.600" textAlign="center">
              © 2025, Dibuat dengan{' '}
              <Icon as={FiHeart} color="red.500" display="inline" mb="-2px" />
              {' '}oleh <Text as="span" fontWeight="semibold" color="gray.700">Kurnia Ramadhan</Text>
            </Text>
          </Flex>
        </VStack>
      </Container>
    </Box>
  )
}

export default App
